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
import { getAuthUserId } from './utils';

export async function authorizeThreadAccess(
  ctx: ActionCtx | MutationCtx | QueryCtx,
  threadId: string,
) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error('Unauthorized: user is required');
  }
  const { userId: threadUserId } = await getThreadMetadata(ctx, components.agent, { threadId });
  if (threadUserId !== userId) {
    throw new Error('Unauthorized: user does not match thread user');
  }
}

export const createNewThread = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    const threadId = await createThread(ctx, components.agent, { userId });
    return threadId;
  },
});

export const listThreads = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
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
    const userId = await getAuthUserId(ctx);
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
  handler: async (ctx, { prompt, threadId }) => {
    await authorizeThreadAccess(ctx, threadId);
    const { messageId } = await agent.saveMessage(ctx, {
      threadId,
      prompt,
      // we're in a mutation, so skip embeddings for now. They'll be generated
      // lazily when streaming text.
      skipEmbeddings: true,
    });
    await ctx.scheduler.runAfter(0, internal.threads.streamAsync, {
      threadId,
      promptMessageId: messageId,
    });
  },
});

export const streamAsync = internalAction({
  args: { promptMessageId: v.string(), threadId: v.string() },
  handler: async (ctx, { promptMessageId, threadId }) => {
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

export const updateThreadTitle = action({
  args: { threadId: v.string(), checkTitle: v.boolean() },
  handler: async (ctx, { threadId, checkTitle }) => {
    const { thread } = await agent.continueThread(ctx, { threadId });
    const { title: currentTitle } = await thread.getMetadata();
    if (!(checkTitle && currentTitle)) {
      const {
        object: { title },
      } = await thread.generateObject(
        {
          mode: 'json',
          schemaDescription:
            'Generate a title for the thread. The title should capture the main topic of the thread and be a max of 7 words.',
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
