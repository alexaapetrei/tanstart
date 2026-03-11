import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  rooms: defineTable({
    name: v.string(),
    revealed: v.boolean(),
    maxFib: v.optional(v.number()),
  }).index("by_name", ["name"]),
  players: defineTable({
    roomId: v.id("rooms"),
    nickname: v.string(),
    vote: v.union(v.string(), v.null()),
    isGM: v.boolean(),
    lastSeen: v.number(),
  }).index("by_room", ["roomId"]),
});
