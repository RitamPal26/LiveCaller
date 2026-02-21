import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const markRead = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return;

    const existingReceipt = await ctx.db
      .query("readReceipts")
      .withIndex("by_user_and_conversation", (q) =>
        q.eq("userId", user._id).eq("conversationId", args.conversationId),
      )
      .first();

    if (existingReceipt) {
      await ctx.db.patch(existingReceipt._id, { lastReadTime: Date.now() });
    } else {
      await ctx.db.insert("readReceipts", {
        userId: user._id,
        conversationId: args.conversationId,
        lastReadTime: Date.now(),
      });
    }
  },
});
