import { fetchContextMessages, MessageDoc } from '@convex-dev/agent';
import { MINUTE, RateLimiter, SECOND } from '@convex-dev/rate-limiter';

import { components } from './_generated/api';
import { QueryCtx } from './_generated/server';
import { getAuthUserId } from './utils';

export const rateLimiter = new RateLimiter(components.rateLimiter, {
  sendMessage: {
    kind: 'fixed window',
    period: 5 * SECOND,
    rate: 1,
    capacity: 1,
  },
  globalSendMessage: {
    kind: 'token bucket',
    period: MINUTE,
    rate: 11,
    capacity: 15,
  },
  tokenUsage: {
    kind: 'token bucket',
    period: MINUTE,
    rate: 2000,
    capacity: 10000,
  },
  globalTokenUsage: {
    kind: 'token bucket',
    period: MINUTE,
    rate: 187_500,
    capacity: 250_000,
  },
});

// This is a rough estimate of the tokens that will be used.
// It's not perfect, but it's a good enough estimate for a pre-generation check.
export async function estimateTokens(
  ctx: QueryCtx,
  threadId: string | undefined,
  prompt: string,
): Promise<number> {
  // Assume roughly 4 characters per token
  const promptTokens: number = prompt.length / 4;
  // Assume a 3x longer non-zero reply
  const estimatedOutputTokens: number = promptTokens * 3 + 1;
  const latestMessages: MessageDoc[] = await fetchContextMessages(ctx, components.agent, {
    threadId,
    userId: await getAuthUserId(ctx),
    searchText: prompt,
    contextOptions: { recentMessages: 2 },
  });
  // Our new usage will roughly be the previous tokens + the prompt.
  // The previous tokens include the tokens for the full message history and output tokens, which will be part of our new history.
  // Note:
  // - It over-counts if the history is longer than the context message limit, since some messages for the previous prompt won't be included.
  // - It doesn't account for the output tokens.
  const lastUsageMessage: MessageDoc | undefined = latestMessages
    .reverse()
    .find((message) => message.usage);
  const lastPromptTokens: number = lastUsageMessage?.usage?.totalTokens ?? 1;
  return lastPromptTokens + promptTokens + estimatedOutputTokens;
}
