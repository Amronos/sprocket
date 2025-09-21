import { google } from '@ai-sdk/google';
import { Agent, type Config } from '@convex-dev/agent';

import { components } from './_generated/api';
import { rateLimiter } from './rateLimiter';

const sharedConfig: Config = {
  usageHandler: async (ctx, { usage, userId }): Promise<void> => {
    if (!userId) {
      return;
    }
    // We consume the token usage here, once we know the full usage.
    // This is too late for the first generation, but prevents further requests until we've paid off that debt.
    await rateLimiter.limit(ctx, 'tokenUsage', {
      key: userId,
      // You could weight different kinds of tokens differently here.
      count: usage.totalTokens,
      // Reserving the tokens means it won't fail here, but will allow it to go negative, disallowing further requests in the mutation's check call.
      reserve: true,
    });
  },
} satisfies Config;

export const agent: Agent = new Agent(components.agent, {
  name: 'My Agent',
  languageModel: google.chat('gemini-2.5-flash-lite'),
  instructions:
    "\
      You are Sprocket an AI agent designed to help with robotics development.\
      While talking to the user, don't be repetitive with your responses and keep them concise while addressing the user's queries.\
      You can use markdown and latex to format your responses.\
    ",
  ...sharedConfig,
});
