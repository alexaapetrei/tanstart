import { defineWebSocket } from "vinxi/http";

interface Player {
  nickname: string;
  vote: string | null;
  isGM: boolean;
}

interface Room {
  id: string;
  players: Record<string, Player>;
  revealed: boolean;
}

const rooms: Record<string, Room> = {};

export default defineWebSocket({
  open(peer) {
    console.log("[ws] open", peer.id);
  },
  message(peer, message) {
    console.log("[ws] message", peer.id, message.text());
    const data = JSON.parse(message.text());
    const { type, roomId, nickname, vote } = data;

    if (type === "join") {
      peer.subscribe(roomId);
      if (!rooms[roomId]) {
        rooms[roomId] = { id: roomId, players: {}, revealed: false };
      }
      const isGM = Object.keys(rooms[roomId].players).length === 0;
      rooms[roomId].players[peer.id] = { nickname, vote: null, isGM };

      peer.publish(roomId, JSON.stringify({ type: "state", state: rooms[roomId] }));
      peer.send(JSON.stringify({ type: "state", state: rooms[roomId], selfId: peer.id }));
    } else if (type === "vote") {
      if (rooms[roomId] && rooms[roomId].players[peer.id]) {
        rooms[roomId].players[peer.id].vote = vote;
        peer.publish(roomId, JSON.stringify({ type: "state", state: rooms[roomId] }));
        peer.send(JSON.stringify({ type: "state", state: rooms[roomId] }));
      }
    } else if (type === "reveal") {
      if (rooms[roomId] && rooms[roomId].players[peer.id]?.isGM) {
        rooms[roomId].revealed = true;
        peer.publish(roomId, JSON.stringify({ type: "state", state: rooms[roomId] }));
        peer.send(JSON.stringify({ type: "state", state: rooms[roomId] }));
      }
    } else if (type === "reset") {
      if (rooms[roomId] && rooms[roomId].players[peer.id]?.isGM) {
        rooms[roomId].revealed = false;
        for (const pid in rooms[roomId].players) {
          rooms[roomId].players[pid].vote = null;
        }
        peer.publish(roomId, JSON.stringify({ type: "state", state: rooms[roomId] }));
        peer.send(JSON.stringify({ type: "state", state: rooms[roomId] }));
      }
    }
  },
  close(peer) {
    console.log("[ws] close", peer.id);
    for (const roomId in rooms) {
      if (rooms[roomId].players[peer.id]) {
        const wasGM = rooms[roomId].players[peer.id].isGM;
        delete rooms[roomId].players[peer.id];

        if (Object.keys(rooms[roomId].players).length === 0) {
          delete rooms[roomId];
        } else {
          if (wasGM) {
            const nextPid = Object.keys(rooms[roomId].players)[0];
            rooms[roomId].players[nextPid].isGM = true;
          }
          peer.publish(roomId, JSON.stringify({ type: "state", state: rooms[roomId] }));
        }
        break;
      }
    }
  },
});
