import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const store = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Called storeUser without authentication present");
    }

    const workosId: string = String(identity.id);
    const name: string = String(identity.name);
    const firstName: string = String(identity.first_name);
    const lastName: string = String(identity.last_name);
    const email: string = String(identity.email);
    const emailVerified: boolean = JSON.parse(String(identity.email_verified));
    const pfpUrl: string = String(identity.profile_picture_url);

    // Check if we've already stored this identity before.
    const user = await ctx.db
      .query("users")
      .withIndex("by_workosId", (q) =>
        q.eq("workosId", workosId)
      )
      .unique();

    if (user !== null) {
      // If we've seen this identity before but details have changed, patch the user.
      if (user.name !== name) {
        await ctx.db.patch(user._id, { name });
      }
      if (user.firstName !== firstName) {
        await ctx.db.patch(user._id, { firstName });
      }
      if (user.lastName !== lastName) {
        await ctx.db.patch(user._id, { lastName });
      }
      if (user.email !== email) {
        await ctx.db.patch(user._id, { email });
      }
      if (user.emailVerified !== emailVerified) {
        await ctx.db.patch(user._id, { emailVerified });
      }
      if (user.pfpUrl !== pfpUrl) {
        await ctx.db.patch(user._id, { pfpUrl });
      }
      return user._id;
    }
    // If it's a new identity, create a new user.
    return await ctx.db.insert("users", {
      workosId,
      name,
      firstName,
      lastName,
      email,
      emailVerified,
      pfpUrl
    });
  },
});
