import { query, mutation, internalMutation } from "./_generated/server";
import { Infer, v } from "convex/values";
import { internal } from "./_generated/api";
import { getUserReturn } from "./users";

const listMessagesReturn = v.array(v.object({
  _id: v.id("messages"),
  author: v.string(),
  body: v.string(),
  isUserMessage: v.boolean(),
}));
export type ListMessagesReturn = Infer<typeof listMessagesReturn>;

export const list = query({
  args: { user: getUserReturn},
  returns: listMessagesReturn,
  handler: async (ctx, { user }) => {
    // Get messages for the current user in chronological order
    const rawMessages = await ctx.db
      .query("messages")
      .withIndex("by_author", (q) => q.eq("author", user._id))
      .order("asc")
      .take(100);

    // Transform messages to ListMessagesReturn type
    const messages: ListMessagesReturn = [];
    for (const message of rawMessages) {
      messages.push({
        _id: message._id,
        author: message.isUserMessage ? user.name : "AI Assistant",
        body: message.body,
        isUserMessage: message.isUserMessage,
      });
    }

    return messages;
  },
});

export const send = mutation({
  args: {
    body: v.string(),
    user: getUserReturn,
  },
  returns: v.id("messages"),
  handler: async (ctx, { body, user }) => {
    // Validate input
    if (!body.trim()) {
      throw new Error("Message body cannot be empty");
    }
    if (body.length > 1000) {
      throw new Error("Message too long (max 1000 characters)");
    }

    // Insert user message first
    const userMessageId = await ctx.db.insert("messages", {
      body: body.trim(),
      author: user._id,
      isUserMessage: true
    });

    // Schedule AI response to appear after user message
    await ctx.scheduler.runAfter(100, internal.messages.addAIResponse, {
      userId: user._id,
      body: "This is a placeholder response. LLM functionality will be implemented later."
    });

    return userMessageId;
  },
});

// Internal function to add AI response
export const addAIResponse = internalMutation({
  args: {
    userId: v.id("users"),
    body: v.string()
  },
  returns: v.null(),
  handler: async (ctx, { userId, body }) => {
    await ctx.db.insert("messages", {
      body,
      author: userId,
      isUserMessage: false
    });
    return null;
  },
});
