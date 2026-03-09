import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { z } from "zod";

const pokerSearchSchema = z.object({
  nickname: z.string(),
});

export const Route = createFileRoute("/poker/$roomId")({
  component: PokerRoom,
  validateSearch: pokerSearchSchema,
});

interface Player {
  nickname: string;
  vote: string | null;
  isGM: boolean;
}

interface RoomState {
  id: string;
  players: Record<string, Player>;
  revealed: boolean;
}

const FIBONACCI_CARDS = ["0", "1", "2", "3", "5", "8", "13", "21", "?", "☕"];

function PokerRoom() {
  const { roomId } = Route.useParams();
  const { nickname } = Route.useSearch();
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [selfId, setSelfId] = useState<string | null>(null);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/_ws`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      ws.current?.send(JSON.stringify({ type: "join", roomId, nickname }));
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "state") {
        setRoomState(data.state);
        if (data.selfId) setSelfId(data.selfId);
      }
    };

    return () => {
      ws.current?.close();
    };
  }, [roomId, nickname]);

  const handleVote = (vote: string) => {
    ws.current?.send(JSON.stringify({ type: "vote", roomId, vote }));
  };

  const handleReveal = () => {
    ws.current?.send(JSON.stringify({ type: "reveal", roomId }));
  };

  const handleReset = () => {
    ws.current?.send(JSON.stringify({ type: "reset", roomId }));
  };

  if (!roomState) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xl animate-pulse">Connecting to room...</p>
      </div>
    );
  }

  const players = Object.entries(roomState.players);
  const isGM = selfId ? roomState.players[selfId]?.isGM : false;
  const myVote = selfId ? roomState.players[selfId]?.vote : null;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Room: {roomId}</h1>
          <p className="text-gray-600">Playing as {nickname} {isGM && "(GM)"}</p>
        </div>
        <div className="space-x-4">
          {isGM && (
            <>
              <button
                onClick={handleReveal}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
                disabled={roomState.revealed}
              >
                Reveal Cards
              </button>
              <button
                onClick={handleReset}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition"
              >
                Reset Round
              </button>
            </>
          )}
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Players List */}
        <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Players</h2>
          <ul className="space-y-3">
            {players.map(([id, player]) => (
              <li key={id} className="flex justify-between items-center">
                <span className="flex items-center">
                  {player.nickname}
                  {player.isGM && <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">GM</span>}
                </span>
                <span className="flex items-center">
                  {player.vote ? (
                    roomState.revealed ? (
                      <span className="font-bold text-lg text-blue-600">{player.vote}</span>
                    ) : (
                      <span className="text-green-500 font-bold">✓</span>
                    )
                  ) : (
                    <span className="text-gray-300">...</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Voting Area */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-lg shadow-sm border mb-8 text-center">
            <h2 className="text-xl font-semibold mb-6">Choose your card</h2>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
              {FIBONACCI_CARDS.map((card) => (
                <button
                  key={card}
                  onClick={() => handleVote(card)}
                  disabled={roomState.revealed}
                  className={`
                    h-24 rounded-lg border-2 text-2xl font-bold transition-all
                    ${myVote === card ? "border-blue-600 bg-blue-50 text-blue-600 shadow-md" : "border-gray-200 hover:border-blue-400 text-gray-600"}
                    ${roomState.revealed ? "opacity-50 cursor-not-allowed" : "hover:scale-105 active:scale-95"}
                  `}
                >
                  {card}
                </button>
              ))}
            </div>
          </div>

          {roomState.revealed && (
            <div className="bg-blue-600 text-white p-6 rounded-lg shadow-md text-center">
              <h2 className="text-xl font-semibold mb-2">Results Revealed!</h2>
              <p className="text-3xl font-bold">
                {calculateAverage(players.map(p => p[1].vote))}
              </p>
              <p className="text-blue-100">Average Points</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function calculateAverage(votes: (string | null)[]) {
  const numericVotes = votes
    .filter((v): v is string => v !== null && !isNaN(Number(v)))
    .map(Number);

  if (numericVotes.length === 0) return "N/A";
  const sum = numericVotes.reduce((a, b) => a + b, 0);
  return (sum / numericVotes.length).toFixed(1);
}
