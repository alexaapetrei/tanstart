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
    playerId: v.optional(v.id("players")),
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
        lastInteraction: Date.now(),
      });
      room = (await ctx.db.get(roomId))!;
    } else {
      await ctx.db.patch(room._id, { lastInteraction: Date.now() });
    }

    if (args.playerId) {
      const existingPlayer = await ctx.db.get(args.playerId);
      if (existingPlayer && existingPlayer.roomId === room._id) {
        // Just update last seen
        await ctx.db.patch(existingPlayer._id, {
          lastSeen: Date.now(),
        });
        return { roomId: room._id, playerId: existingPlayer._id };
      }
    }

    const existingPlayers = await ctx.db
      .query("players")
      .withIndex("by_room", (q) => q.eq("roomId", room!._id))
      .collect();

    let finalNickname = args.nickname;
    let counter = 2;
    while (
      existingPlayers.some(
        (p) => p.nickname.toLowerCase() === finalNickname.toLowerCase()
      )
    ) {
      finalNickname = `${args.nickname} ${counter}`;
      counter++;
    }

    const isGM = existingPlayers.length === 0;

    const playerId = await ctx.db.insert("players", {
      roomId: room._id,
      nickname: finalNickname,
      vote: null,
      isGM,
      lastSeen: Date.now(),
    });

    return { roomId: room._id, playerId };
  },
});

export const setMaxFib = mutation({
  args: { roomId: v.id("rooms"), maxFib: v.number() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.roomId, {
      maxFib: args.maxFib,
      lastInteraction: Date.now(),
    });
  },
});

export const vote = mutation({
  args: { playerId: v.id("players"), vote: v.union(v.string(), v.null()) },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (player) {
      await ctx.db.patch(args.playerId, {
        vote: args.vote,
        lastSeen: Date.now(),
      });
      await ctx.db.patch(player.roomId, { lastInteraction: Date.now() });
    }
  },
});

export const reveal = mutation({
  args: { roomId: v.id("rooms"), revealed: v.boolean() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.roomId, {
      revealed: args.revealed,
      lastInteraction: Date.now(),
    });
  },
});

export const reset = mutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.roomId, {
      revealed: false,
      lastInteraction: Date.now(),
    });
    const players = await ctx.db
      .query("players")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();
    for (const player of players) {
      await ctx.db.patch(player._id, { vote: null });
    }
  },
});

export const updatePlayerName = mutation({
  args: {
    playerId: v.id("players"),
    newName: v.string(),
  },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (!player) throw new Error("Player not found");

    const existingPlayers = await ctx.db
      .query("players")
      .withIndex("by_room", (q) => q.eq("roomId", player.roomId))
      .collect();

    let finalNickname = args.newName;
    let counter = 2;
    while (
      existingPlayers.some(
        (p) =>
          p.nickname.toLowerCase() === finalNickname.toLowerCase() &&
          p._id !== args.playerId
      )
    ) {
      finalNickname = `${args.newName} ${counter}`;
      counter++;
    }

    await ctx.db.patch(args.playerId, {
      nickname: finalNickname,
      lastSeen: Date.now(),
    });
    await ctx.db.patch(player.roomId, { lastInteraction: Date.now() });
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
    const playerTimeout = 300000; // 5 minutes
    const roomTimeout = 3600000; // 1 hour

    for (const player of players) {
      if (now - player.lastSeen > playerTimeout) {
        await ctx.db.delete(player._id);

        // If the GM left, assign a new GM
        if (player.isGM) {
          const remainingPlayers = await ctx.db
            .query("players")
            .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
            .collect();

          if (remainingPlayers.length > 0) {
            await ctx.db.patch(remainingPlayers[0]._id, { isGM: true });
          }
        }
      }
    }

    // Check if room itself should be deleted due to inactivity
    const room = await ctx.db.get(args.roomId);
    if (room && now - room.lastInteraction > roomTimeout) {
      // Delete all remaining players and the room
      const remainingPlayers = await ctx.db
        .query("players")
        .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
        .collect();
      for (const p of remainingPlayers) {
        await ctx.db.delete(p._id);
      }
      await ctx.db.delete(args.roomId);
    }
  },
});
