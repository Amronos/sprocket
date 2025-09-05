import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  users: defineTable({
    workosId: v.string(),
    name: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    emailVerified: v.boolean(),
    pfpUrl: v.string(),
  }).index('by_workosId', ['workosId']),
});
