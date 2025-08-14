import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const messages = await ctx.db.query("messages").order("desc").take(100);
    const messagesWithAuthor = await Promise.all(
      messages.map(async (message) => {
        const author = await ctx.db.get(message.author);
        return {
          ...message,
          author: author?.name ?? "Unknown",
        };
      })
    );

    const viewerIdentity = await ctx.auth.getUserIdentity();
    const viewer = viewerIdentity
      ? await ctx.db
          .query("users")
          .withIndex("by_workosId", (q) =>
            q.eq("workosId", String(viewerIdentity.id))
          )
          .unique()
      : null;

    return {
      messages: messagesWithAuthor,
      viewer: viewer?.name ?? viewerIdentity?.name ?? "Unknown",
    };
  },
});

export const send = mutation({
  args: { body: v.string() },
  handler: async (ctx, { body }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_workosId", (q) => q.eq("workosId", String(identity.id)))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.insert("messages", { body, author: user._id });
  },
});
