import {
  query,
  mutation,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Fetch all messages for a specific conversation
export const list = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversationId", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .collect();

    return Promise.all(
      messages.map(async (msg) => {
        const sender = await ctx.db.get(msg.senderId);
        return { ...msg, sender };
      }),
    );
  },
});

// Send a new message
export const send = mutation({
  args: {
    conversationId: v.id("conversations"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const trimmedContent = args.content.trim();
    if (trimmedContent.length === 0 || trimmedContent.length > 1000) {
      throw new Error("Message must be between 1 and 1000 characters.");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: user._id,
      content: args.content,
    });
    if (args.content.includes("@AI")) {
      await ctx.scheduler.runAfter(0, api.ai.handleCommand, {
        conversationId: args.conversationId,
        command: args.content,
      });
    }
  },
});

// Soft delete a message
export const softDelete = mutation({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");

    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error("Message not found");

    if (message.senderId !== user._id) {
      throw new Error("You can only delete your own messages");
    }

    await ctx.db.patch(args.messageId, {
      isDeleted: true,
      content: "",
      reactions: [],
    });
  },
});

// Toggle a reaction for a message
export const toggleReaction = mutation({
  args: {
    messageId: v.id("messages"),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");

    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error("Message not found");

    const currentReactions = message.reactions || [];

    const existingIndex = currentReactions.findIndex(
      (r) => r.emoji === args.emoji && r.userId === user._id,
    );

    let newReactions;
    if (existingIndex !== -1) {
      newReactions = [...currentReactions];
      newReactions.splice(existingIndex, 1);
    } else {
      newReactions = [
        ...currentReactions,
        { emoji: args.emoji, userId: user._id },
      ];
    }

    await ctx.db.patch(args.messageId, { reactions: newReactions });
  },
});

// Internal query to fetch messages for AI context
export const getHistoryForAi = internalQuery({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);

    if (!conversation || !conversation.isGroup) {
      throw new Error(
        "Privacy Lock: AI Agent is only allowed to read Group Chats.",
      );
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversationId", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .order("desc")
      .take(20);

    return messages.reverse().map((msg) => ({
      content: msg.content,
      isAi: false,
    }));
  },
});

// Internal mutation to save AI-generated messages
export const sendAiMessage = internalMutation({
  args: {
    conversationId: v.id("conversations"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    let aiUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", "system_ai"))
      .unique();

    if (!aiUser) {
      const newAiId = await ctx.db.insert("users", {
        clerkId: "system_ai",
        name: "AI Agent",
        email: "ai@system.local",
        imageUrl:
          "https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg",
        isOnline: true,
      });
      aiUser = await ctx.db.get(newAiId);
    }

    await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      content: args.content,
      senderId: aiUser!._id,
    });
  },
});
