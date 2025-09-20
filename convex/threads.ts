import {
  createThread,
  getThreadMetadata,
  listMessages,
  syncStreams,
  vStreamArgs,
} from '@convex-dev/agent';
import { toUIMessages } from '@convex-dev/agent/react';
import { paginationOptsValidator } from 'convex/server';
import { v } from 'convex/values';
import { z } from 'zod/v3';

import { components, internal } from './_generated/api';
import {
  action,
  ActionCtx,
  internalAction,
  mutation,
  MutationCtx,
  query,
  QueryCtx,
} from './_generated/server';
import { agent } from './agents';
import { estimateTokens, rateLimiter } from './rateLimiter';
import { AuthUserId, getAuthUserId } from './utils';

export async function authorizeThreadAccess(
  ctx: ActionCtx | MutationCtx | QueryCtx,
  threadId: string,
): Promise<void> {
  const userId: AuthUserId = await getAuthUserId(ctx);
  const { userId: threadUserId } = await getThreadMetadata(ctx, components.agent, { threadId });
  if (threadUserId !== userId) {
    throw new Error('Unauthorized: user does not match thread user');
  }
}

export const createNewThread = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx): Promise<string> => {
    const userId: AuthUserId = await getAuthUserId(ctx);
    const threadId: string = await createThread(ctx, components.agent, { userId });
    return threadId;
  },
});

export const listThreads = query({
  args: {},
  handler: async (ctx) => {
    const userId: AuthUserId = await getAuthUserId(ctx);
    return await ctx.runQuery(components.agent.threads.listThreadsByUserId, {
      userId,
      order: 'asc',
      paginationOpts: { cursor: null, numItems: 100 },
    });
  },
});

export const getLatestThread = query({
  args: {},
  handler: async (ctx) => {
    const userId: AuthUserId = await getAuthUserId(ctx);
    const threads = await ctx.runQuery(components.agent.threads.listThreadsByUserId, {
      userId,
      order: 'desc',
      paginationOpts: { cursor: null, numItems: 1 },
    });
    if (threads.page.length > 0) {
      return threads.page[0];
    }
    return null;
  },
});

export const initiateAsyncStreaming = mutation({
  args: { prompt: v.string(), threadId: v.string() },
  handler: async (ctx, { prompt, threadId }): Promise<void> => {
    const userId: AuthUserId = await getAuthUserId(ctx);
    await authorizeThreadAccess(ctx, threadId);
    // The try-catch avoids an error throw, while preventing a message from sending when a rate limit is exceeded.
    // The client queries the database later to check if the limit has been exceeded.
    try {
      await rateLimiter.limit(ctx, 'sendMessage', { key: userId, throws: true });
      await rateLimiter.limit(ctx, 'globalSendMessage', { throws: true });
      const count: number = await estimateTokens(ctx, threadId, prompt);
      // We only check the limit here, we don't consume the tokens. We track the total usage after it finishes, which is too late for the first generation, but prevents further requests until we've paid off that debt.
      await rateLimiter.check(ctx, 'tokenUsage', {
        key: userId,
        count,
        reserve: true,
        throws: true,
      });
      await rateLimiter.check(ctx, 'globalTokenUsage', {
        count,
        reserve: true,
        throws: true,
      });
      const { messageId } = await agent.saveMessage(ctx, {
        threadId,
        prompt,
        // We're in a mutation, so skip embeddings for now. They'll be generated lazily when streaming text.
        skipEmbeddings: true,
      });
      await ctx.scheduler.runAfter(0, internal.threads.streamAsync, {
        threadId,
        promptMessageId: messageId,
      });
    } catch (e: unknown) {}
  },
});

export const streamAsync = internalAction({
  args: { promptMessageId: v.string(), threadId: v.string() },
  handler: async (ctx, { promptMessageId, threadId }): Promise<void> => {
    const result = await agent.streamText(
      ctx,
      { threadId },
      { promptMessageId },
      { saveStreamDeltas: { chunking: 'word', throttleMs: 100 } },
    );
    // We need to make sure the stream finishes - by awaiting each chunk
    // or using this call to consume it all.
    await result.consumeStream();
  },
});

export const listThreadMessages = query({
  args: {
    threadId: v.string(),
    paginationOpts: paginationOptsValidator,
    streamArgs: vStreamArgs,
  },
  handler: async (ctx, args) => {
    await authorizeThreadAccess(ctx, args.threadId);
    const { threadId, streamArgs } = args;
    const streams = await syncStreams(ctx, components.agent, {
      threadId,
      streamArgs,
      includeStatuses: ['aborted', 'streaming'],
    });
    const paginated = await listMessages(ctx, components.agent, args);
    return {
      ...paginated,
      streams,
      page: toUIMessages(paginated.page),
    };
  },
});

export const renameThread = mutation({
  args: { threadId: v.string(), title: v.string() },
  handler: async (ctx, { threadId, title }) => {
    await authorizeThreadAccess(ctx, threadId);
    await ctx.runMutation(components.agent.threads.updateThread, {
      threadId,
      patch: { title },
    });
  },
});

export const deleteThread = mutation({
  args: { threadId: v.string() },
  handler: async (ctx, { threadId }) => {
    await authorizeThreadAccess(ctx, threadId);
    await agent.deleteThreadAsync(ctx, { threadId });
  },
});

export const generateThreadTitle = action({
  args: { threadId: v.string(), checkTitle: v.boolean() },
  handler: async (ctx, { threadId, checkTitle }): Promise<void> => {
    await authorizeThreadAccess(ctx, threadId);
    const { thread } = await agent.continueThread(ctx, { threadId });
    const { title: currentTitle } = await thread.getMetadata();
    if (!(checkTitle && currentTitle)) {
      const {
        object: { title },
      } = await thread.generateObject(
        {
          mode: 'json',
          schemaDescription:
            'Title for the thread. It captures the main topic of the thread and is a max of 7 words.',
          schema: z.object({
            title: z.string().describe('The new title for the thread'),
          }),
          prompt: 'Generate a title for this thread.',
        },
        { storageOptions: { saveMessages: 'none' } },
      );
      await thread.updateMetadata({ title });
    }
  },
});
