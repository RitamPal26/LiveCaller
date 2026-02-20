import { mutation } from "./_generated/server";
import { query } from "./_generated/server";
import { v } from "convex/values";

export const store = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized: Cannot store user without authentication");
    }

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (existingUser !== null) {
      if (
        existingUser.name !== identity.name ||
        existingUser.imageUrl !== identity.pictureUrl
      ) {
        await ctx.db.patch(existingUser._id, {
          name: identity.name,
          imageUrl: identity.pictureUrl,
        });
      }
      return existingUser._id;
    }

    return await ctx.db.insert("users", {
      clerkId: identity.subject,
      email: identity.email!,
      name: identity.name,
      imageUrl: identity.pictureUrl,
      isOnline: true,
    });
  },
});

export const getUsers = query({
  args: {
    searchTerm: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    let users = await ctx.db.query("users").collect();

    users = users.filter((user) => user.clerkId !== identity.subject);

    if (args.searchTerm) {
      const search = args.searchTerm.toLowerCase();
      users = users.filter(
        (user) =>
          user.name?.toLowerCase().includes(search) ||
          user.email.toLowerCase().includes(search),
      );
    }

    return users;
  },
});

export const markOffline = mutation({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (user) {
      await ctx.db.patch(user._id, { isOnline: false });
    }
  },
});
