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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error("Conversation not found");

    if (!conversation.participantIds.includes(user._id)) {
      throw new Error("Forbidden: You are not a participant in this chat.");
    }

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

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error("Conversation not found");

    if (!conversation.participantIds.includes(user._id)) {
      throw new Error("Forbidden: You are not a participant in this chat.");
    }

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

    const conversation = await ctx.db.get(message.conversationId);
    if (!conversation) throw new Error("Conversation not found");

    if (!conversation.participantIds.includes(user._id)) {
      throw new Error("Forbidden: You cannot react to messages in this chat.");
    }

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

    return Promise.all(
      messages.reverse().map(async (msg) => {
        const sender = await ctx.db.get(msg.senderId);
        return {
          content: msg.content,
          isAi: sender?.clerkId === "system_ai",
          senderName: sender?.name || "Unknown User",
        };
      }),
    );
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
          "data:image/svg+xml;base64,PHN2ZyBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48ZyBjbGlwLXBhdGg9InVybCgjcHJlZml4X19jbGlwMF84XzEzKSI+PHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0zNTguNDg1IDQxLjc1bDE1NC4wMjcgODcuNTczdjEuODU2bC0xNTUuNjA1IDg2LjYzNC4zNjItNDUuMTYyLTE3LjUxNC0uNjRjLTIyLjU5Mi0uNTk4LTM0LjM2OC4wNDItNDguMzg0IDIuMzQ2LTIyLjY5OSAzLjczNC00My40NzggMTIuMzEwLTY3LjEzNiAyOC44NDNsLTQ2LjIwOCAzMi4xMDdjLTYuMDU5IDQuMTYtMTAuNTYgNy4xNjgtMTQuNTA3IDkuNzA2bC0xMC45ODcgNi44Ny04LjQ2OSA0Ljk5MiA4LjIxMyA0LjkwNiAxMS4zMDcgNy4yMTFjMTAuMTU1IDYuNjk5IDI0Ljk2IDE2Ljk4MSA1Ny42MjEgMzkuODA4IDIzLjY4MCAxNi41MzMgNDQuNDM4IDI1LjEwOSA2Ny4xMzYgMjguODQzbDYuNC45NmMxNC44MDYgMS45NDEgMjkuMzM0IDIuMDA1IDYwLjI2Ny43MDRsLjQ2OS00Ni4wNTkgMTU0LjAyNyA4Ny41NzN2MS44NTZsLTE1NS42MDUgODYuNjU2LjI5OC0zOS43MjItMTMuNTQ2LjQ2OWMtMjkuNTY4Ljg5Ni00NS41OTAuMDQzLTY2Ljk0NC0zLjQ1Ni0zNi4xMzktNS45NzMtNjkuNTQ3LTE5Ljc1NS0xMDQuMTI4LTQzLjkyNWwtNDYuMDM4LTMyYTQ2Ny4wNzIgNDY3LjA3MiAwIDAwLTE2LjEwNi0xMC42MjRsLTkuOTYzLTUuOTc0Yy01LjM4LTMuMS0xMC43ODUtNi4xNTctMTYuMjEzLTkuMTczQzYyLjAzNyAzMTQuMjQgMTIuMDEgMzAxLjE0MSAwIDMwMS4xNDF2LTkwLjE5N2wyLjk4Ny4wODVjMTIuMDMyLS4xNDkgNjIuMDgtMTMuMjY5IDgxLjI1OC0yMy45NzhsMjEuNjc1LTEyLjM3NCA5LjM0NC01Ljg0NWM5LjEzMS01Ljk3MyAyMi44NjktMTUuNDg4IDU3LjMwMS0zOS41MzEgMzQuNTgyLTI0LjE3IDY3Ljk2OC0zNy45NzMgMTA0LjEyOC00My45MjUgMjQuNTc2LTQuMDUzIDQyLjExMi00LjU0NCA4MS4zNjYtMi45NDRsLjQyNi00MC42ODN6IiBmaWxsPSIjMDAwIi8+PC9nPjxkZWZzPjxjbGlwUGF0aCBpZD0icHJlZml4X19jbGlwMF84XzEzIj48cGF0aCBmaWxsPSIjZmZmIiBkPSJNMCAwaDUxMnY1MTJIMHoiLz48L2NsaXBQYXRoPjwvZGVmcz48L3N2Zz4=",
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
