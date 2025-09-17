import { Infer, v } from 'convex/values';

import { internal } from './_generated/api';
import { ActionCtx, MutationCtx, QueryCtx } from './_generated/server';

const userId = v.id('users');
export type AuthUserId = Infer<typeof userId>;

export async function getAuthUserId(_ctx: ActionCtx | MutationCtx | QueryCtx): Promise<AuthUserId> {
  return (await _ctx.runQuery(internal.users.get))._id;
}
