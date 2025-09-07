import { createThread, listMessages, syncStreams, vStreamArgs } from '@convex-dev/agent';
import { toUIMessages } from '@convex-dev/agent/react';
import { paginationOptsValidator } from 'convex/server';
import { v } from 'convex/values';

import { api, components, internal } from './_generated/api';
import { internalAction, internalMutation, mutation, query } from './_generated/server';
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

export const getLatestThread = query({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
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
    // Now, check if we should generate a title.
    const thread = await ctx.runQuery(components.agent.threads.getThread, { threadId });
    if (thread && (!thread.title || thread.title == '...')) {
      await ctx.scheduler.runAfter(0, internal.threads.generateTitle, { threadId });
    }
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

export const createSystemThread = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    return await createThread(ctx, components.agent);
  },
});

export const nameThread = mutation({
  args: { threadId: v.string(), title: v.string() },
  handler: async (ctx, args) => {
    const { threadId, title } = args;
    await ctx.runMutation(components.agent.threads.updateThread, {
      patch: { title: title },
      threadId: threadId,
    });
  },
});

export const generateTitle = internalAction({
  args: { threadId: v.string() },
  handler: async (ctx, { threadId }) => {
    const { page: messages } = await ctx.runQuery(api.threads.listThreadMessages, {
      threadId,
      paginationOpts: { numItems: 100, cursor: null },
    });
    if (messages.length === 0) {
      return;
    }
    const firstMessage = messages[0];

    const prompt =
      "You are having a conversation with me in a separate thread about a robotics project, I need you to create a title for it (return only the single title in your response and keep it short). Make the title the project's name, if there is none, either create one or let the title be 'New Project'. Here is the first message of the thread:\n" +
      firstMessage.text;

    const namingThreadId = await ctx.runMutation(api.threads.createSystemThread, {});
    const { text: title } = await agent.generateText(ctx, { threadId: namingThreadId }, { prompt });
    await ctx.runMutation(internal.threads.saveTitle, { threadId, title });
  },
});

export const saveTitle = internalMutation({
  args: { threadId: v.string(), title: v.string() },
  handler: async (ctx, { threadId, title }) => {
    await ctx.runMutation(components.agent.threads.updateThread, {
      threadId,
      patch: { title },
    });
  },
});
