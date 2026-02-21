import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // 1. Users Table
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    isOnline: v.boolean(),
    lastSeen: v.optional(v.number()),
  }).index("by_clerkId", ["clerkId"]),

  // 2. Conversations Table
  conversations: defineTable({
    name: v.optional(v.string()),
    participantIds: v.array(v.id("users")),
    isGroup: v.optional(v.boolean()),
    groupName: v.optional(v.string()),
  }),

  // 3. Messages Table
  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    content: v.string(),
    isDeleted: v.optional(v.boolean()),
    reactions: v.optional(
      v.array(
        v.object({
          emoji: v.string(),
          userId: v.id("users"),
        }),
      ),
    ),
  }).index("by_conversationId", ["conversationId"]),

  // 4. Read Receipts Table
  readReceipts: defineTable({
    userId: v.id("users"),
    conversationId: v.id("conversations"),
    lastReadTime: v.number(),
  }).index("by_user_and_conversation", ["userId", "conversationId"]),

  // 5. Typing Indicators Table
  typingIndicators: defineTable({
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    expiresAt: v.number(),
  }).index("by_conversation", ["conversationId"]),
});
