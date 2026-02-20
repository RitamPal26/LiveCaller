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
  }).index("by_clerkId", ["clerkId"]),

  // 2. Conversations Table
  conversations: defineTable({
    isGroup: v.boolean(),
    name: v.optional(v.string()),
    participantIds: v.array(v.id("users")),
  }),

  // 3. Messages Table
  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    content: v.string(),
    isDeleted: v.optional(v.boolean()),
  }).index("by_conversationId", ["conversationId"]),
});