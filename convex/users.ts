import { mutation } from "./_generated/server";

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
