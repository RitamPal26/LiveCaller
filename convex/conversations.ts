import { query, mutation } from "./_generated/server";
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
        conv.participantIds.includes(args.participantId),
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

export const listActive = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!currentUser) throw new Error("User not found");

    const allConversations = await ctx.db.query("conversations").collect();

    const myConversations = allConversations.filter((conv) =>
      conv.participantIds.includes(currentUser._id),
    );

    const enrichedConversations = await Promise.all(
      myConversations.map(async (conv) => {
        const otherUserId = conv.participantIds.find(
          (id) => id !== currentUser._id,
        );
        const otherUser = otherUserId ? await ctx.db.get(otherUserId) : null;

        const lastMessage = await ctx.db
          .query("messages")
          .withIndex("by_conversationId", (q) =>
            q.eq("conversationId", conv._id),
          )
          .order("desc")
          .first();

        const lastMessageSender = lastMessage
          ? await ctx.db.get(lastMessage.senderId)
          : null;

        const receipt = await ctx.db
          .query("readReceipts")
          .withIndex("by_user_and_conversation", (q) =>
            q.eq("userId", currentUser._id).eq("conversationId", conv._id),
          )
          .first();

        const lastReadTime = receipt ? receipt.lastReadTime : 0;

        const unreadMessages = await ctx.db
          .query("messages")
          .withIndex("by_conversationId", (q) =>
            q.eq("conversationId", conv._id),
          )
          .filter((q) =>
            q.and(
              q.gt(q.field("_creationTime"), lastReadTime),
              q.neq(q.field("senderId"), currentUser._id),
            ),
          )
          .collect();

        const unreadCount = unreadMessages.length;
        const updatedAt = lastMessage
          ? lastMessage._creationTime
          : conv._creationTime;

        return {
          _id: conv._id,
          isGroup: conv.isGroup,
          groupName: conv.groupName,
          participantCount: conv.participantIds.length,
          otherUser: otherUser,
          lastMessage: lastMessage
            ? {
                ...lastMessage,
                senderName: lastMessageSender?.name?.split(" ")[0] || "Someone",
                isMe: lastMessage.senderId === currentUser._id,
              }
            : null,
          unreadCount: unreadCount,
          updatedAt: updatedAt,
        };
      }),
    );

    return enrichedConversations.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

export const createGroup = mutation({
  args: {
    participantIds: v.array(v.id("users")),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");

    const allParticipants = [...new Set([...args.participantIds, user._id])];

    if (allParticipants.length < 3) {
      throw new Error("Group must have at least 3 members (including you).");
    }

    const conversationId = await ctx.db.insert("conversations", {
      participantIds: allParticipants,
      isGroup: true,
      groupName: args.name,
    });

    return conversationId;
  },
});

export const getConversation = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const conv = await ctx.db.get(args.conversationId);
    if (!conv) return null;

    return conv;
  },
});
