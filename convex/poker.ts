import { mutation, query } from "./_generated/server";
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
  args: {
    roomName: v.string(),
    nickname: v.string(),
    playerId: v.optional(v.id("players"))
  },
  handler: async (ctx, args) => {
    let room = await ctx.db
      .query("rooms")
      .withIndex("by_name", (q) => q.eq("name", args.roomName))
      .unique();

    if (!room) {
      const roomId = await ctx.db.insert("rooms", {
        name: args.roomName,
        revealed: false,
        maxFib: 8,
      });
      room = (await ctx.db.get(roomId))!;
    }

    const existingPlayers = await ctx.db
      .query("players")
      .withIndex("by_room", (q) => q.eq("roomId", room!._id))
      .collect();

    // Re-authentication logic
    if (args.playerId) {
      const existingPlayer = await ctx.db.get(args.playerId);
      if (existingPlayer && existingPlayer.roomId === room._id) {
        // Player exists and is in the correct room, update their heartbeat and return
        await ctx.db.patch(args.playerId, { lastSeen: Date.now() });
        return { roomId: room._id, playerId: args.playerId };
      }
    }

    const existingPlayerWithSameName = existingPlayers.find(
      (p) => p.nickname.toLowerCase() === args.nickname.toLowerCase()
    );

    if (existingPlayerWithSameName) {
      // Check if it's the same player (e.g. within 30 seconds of last seen)
      if (Date.now() - existingPlayerWithSameName.lastSeen < 30000) {
        throw new Error("Nickname is already taken");
      } else {
        // Assume old player timed out but cleanOldPlayers hasn't run yet
        await ctx.db.delete(existingPlayerWithSameName._id);
      }
    }

    const isGM = existingPlayers.length === 0;

    const newPlayerId = await ctx.db.insert("players", {
      roomId: room._id,
      nickname: args.nickname,
      vote: null,
      isGM,
      lastSeen: Date.now(),
    });

    return { roomId: room._id, playerId: newPlayerId };
  },
});

export const setMaxFib = mutation({
  args: { roomId: v.id("rooms"), maxFib: v.number() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.roomId, { maxFib: args.maxFib });
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
