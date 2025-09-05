import { createThread, listMessages, syncStreams, vStreamArgs } from '@convex-dev/agent';
import { toUIMessages } from '@convex-dev/agent/react';
import { paginationOptsValidator } from 'convex/server';
import { v } from 'convex/values';

import { components, internal } from './_generated/api';
import { internalAction, mutation, query } from './_generated/server';
import { agent } from './agents';

export const createNewThread = mutation({
  args: { userId: v.id('users') },
  returns: v.string(),
  handler: async (ctx, { userId }) => {
    const threadId = await createThread(ctx, components.agent, { userId });
    return threadId;
  },
});

export const listThreads = query({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    return await ctx.runQuery(components.agent.threads.listThreadsByUserId, {
      userId,
      order: 'asc',
      paginationOpts: { cursor: null, numItems: 100 },
    });
  },
});

export const initiateAsyncStreaming = mutation({
  args: { prompt: v.string(), threadId: v.string() },
  handler: async (ctx, { prompt, threadId }) => {
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
