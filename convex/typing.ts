import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const set = mutation({
  args: {
    conversationId: v.id("conversations"),
    isTyping: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return;

    const existing = await ctx.db
      .query("typingIndicators")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .filter((q) => q.eq(q.field("userId"), user._id))
      .first();

    if (!args.isTyping) {
      if (existing) {
        await ctx.db.delete(existing._id);
      }
      return;
    }

    const expiresAt = Date.now() + 3000;

    if (existing) {
      await ctx.db.patch(existing._id, { expiresAt });
    } else {
      await ctx.db.insert("typingIndicators", {
        conversationId: args.conversationId,
        userId: user._id,
        expiresAt,
      });
    }
  },
});

export const getActive = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!currentUser) return [];

    const now = Date.now();

    const activeIndicators = await ctx.db
      .query("typingIndicators")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .filter((q) => q.gt(q.field("expiresAt"), now))
      .filter((q) => q.neq(q.field("userId"), currentUser._id))
      .collect();

    return Promise.all(
      activeIndicators.map(async (indicator) => {
        const typer = await ctx.db.get(indicator.userId);
        return typer?.name || "Someone";
      }),
    );
  },
});
