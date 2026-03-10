import { mutation, query } from "convex/server";
import { v } from "convex/values";

export const getRoom = query({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const room = await ctx.db
      .query("rooms")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .unique();

    if (!room) return null;

    const players = await ctx.db
      .query("players")
      .withIndex("by_room", (q) => q.eq("roomId", room._id))
      .collect();

    return { ...room, players };
  },
});

export const joinRoom = mutation({
  args: { roomName: v.string(), nickname: v.string() },
  handler: async (ctx, args) => {
    let room = await ctx.db
      .query("rooms")
      .withIndex("by_name", (q) => q.eq("name", args.roomName))
      .unique();

    if (!room) {
      const roomId = await ctx.db.insert("rooms", {
        name: args.roomName,
        revealed: false,
      });
      room = (await ctx.db.get(roomId))!;
    }

    const existingPlayers = await ctx.db
      .query("players")
      .withIndex("by_room", (q) => q.eq("roomId", room!._id))
      .collect();

    const isGM = existingPlayers.length === 0;

    const playerId = await ctx.db.insert("players", {
      roomId: room._id,
      nickname: args.nickname,
      vote: null,
      isGM,
      lastSeen: Date.now(),
    });

    return { roomId: room._id, playerId };
  },
});

export const vote = mutation({
  args: { playerId: v.id("players"), vote: v.union(v.string(), v.null()) },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.playerId, { vote: args.vote, lastSeen: Date.now() });
  },
});

export const reveal = mutation({
  args: { roomId: v.id("rooms"), revealed: v.boolean() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.roomId, { revealed: args.revealed });
  },
});

export const reset = mutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.roomId, { revealed: false });
    const players = await ctx.db
      .query("players")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();
    for (const player of players) {
      await ctx.db.patch(player._id, { vote: null });
    }
  },
});

export const heartbeat = mutation({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.playerId, { lastSeen: Date.now() });
  },
});

export const cleanOldPlayers = mutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const players = await ctx.db
      .query("players")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    const now = Date.now();
    const timeout = 30000; // 30 seconds

    for (const player of players) {
      if (now - player.lastSeen > timeout) {
        await ctx.db.delete(player._id);

        // If the GM left, assign a new GM
        if (player.isGM) {
          const remainingPlayers = await ctx.db
            .query("players")
            .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
            .collect();

          if (remainingPlayers.length > 0) {
            await ctx.db.patch(remainingPlayers[0]._id, { isGM: true });
          } else {
            // Delete room if no players left?
            // Optional: await ctx.db.delete(args.roomId);
          }
        }
      }
    }
  },
});
