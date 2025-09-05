import { google } from '@ai-sdk/google';
import { Agent } from '@convex-dev/agent';

import { components } from './_generated/api';

export const agent = new Agent(components.agent, {
  name: 'My Agent',
  languageModel: google.chat('gemini-2.5-flash-lite'),
  instructions:
    "You are Sprocket an AI agent designed to help with robotics development. While talking to the user, don't be repetitive with your responses and keep them concise while addressing the user's queries.",
});
