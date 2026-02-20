import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const createOrGet = mutation({
  args: {
    participantId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!currentUser) throw new Error("Current user not found in database");

    const conversations = await ctx.db
      .query("conversations")
      .filter((q) => q.eq(q.field("isGroup"), false))
      .collect();

    const existingConversation = conversations.find(
      (conv) =>
        conv.participantIds.includes(currentUser._id) &&
        conv.participantIds.includes(args.participantId)
    );

    if (existingConversation) {
      return existingConversation._id;
    }

    const newConversationId = await ctx.db.insert("conversations", {
      isGroup: false,
      participantIds: [currentUser._id, args.participantId],
    });

    return newConversationId;
  },
});