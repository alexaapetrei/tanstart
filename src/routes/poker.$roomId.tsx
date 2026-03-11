import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { AlertCircle, Copy, Eye, Info, RefreshCw, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { api } from "../../convex/_generated/api";

const pokerSearchSchema = z.object({
	nickname: z.string(),
});

export const Route = createFileRoute("/poker/$roomId")({
	component: PokerRoom,
	validateSearch: pokerSearchSchema,
});

const FIBONACCI_SEQUENCE = ["0", "1", "2", "3", "5", "8", "13", "21"];
const SPECIAL_CARDS = ["?", "☕"];

function PokerRoom() {
	const { roomId: roomName } = Route.useParams();
	const { nickname } = Route.useSearch();

	const roomData = useQuery(api.poker.getRoom, { name: roomName });
	const joinRoom = useMutation(api.poker.joinRoom);
	const voteMutation = useMutation(api.poker.vote);
	const revealMutation = useMutation(api.poker.reveal);
	const resetMutation = useMutation(api.poker.reset);
	const heartbeatMutation = useMutation(api.poker.heartbeat);
	const cleanOldPlayersMutation = useMutation(api.poker.cleanOldPlayers);
	const setMaxFibMutation = useMutation(api.poker.setMaxFib);

	const [playerId, setPlayerId] = useState<string | null>(() => {
		if (typeof window !== "undefined") {
			const saved = localStorage.getItem(`poker_playerId_${roomName}`);
			return saved;
		}
		return null;
	});
	const [joined, setJoined] = useState(false);
	const [joinError, setJoinError] = useState<string | null>(null);

	const navigate = Route.useNavigate();

	useEffect(() => {
		if (!joined && roomData !== undefined) {
			joinRoom({ roomName, nickname })
				.then(({ playerId }) => {
					setPlayerId(playerId);
					setJoined(true);
					localStorage.setItem(`poker_playerId_${roomName}`, playerId);
				})
				.catch((err) => {
					if (err.message.includes("Nickname is already taken")) {
						setJoinError("taken");
					}
				});
		}
	}, [joined, roomData, roomName, nickname, joinRoom]);

	useEffect(() => {
		if (joinError === "taken") {
			navigate({
				to: "/",
				search: {
					roomId: roomName,
					error: "Nickname is already taken",
				},
			});
		}
	}, [joinError, navigate, roomName]);

	useEffect(() => {
		if (playerId && roomData?._id) {
			const interval = setInterval(() => {
				heartbeatMutation({ playerId: playerId as any });
				cleanOldPlayersMutation({ roomId: roomData._id });
			}, 10000);
			return () => clearInterval(interval);
		}
	}, [playerId, roomData?._id, heartbeatMutation, cleanOldPlayersMutation]);

	const handleVote = (vote: string) => {
		if (playerId) {
			voteMutation({ playerId: playerId as any, vote });
		}
	};

	const handleReveal = () => {
		if (roomData?._id) {
			revealMutation({ roomId: roomData._id, revealed: true });
		}
	};

	const handleReset = () => {
		if (roomData?._id) {
			resetMutation({ roomId: roomData._id });
		}
	};

	const handleSetMaxFib = (max: number) => {
		if (roomData?._id && isGM) {
			setMaxFibMutation({ roomId: roomData._id, maxFib: max });
		}
	};

	const copyRoomLink = () => {
		navigator.clipboard.writeText(window.location.href);
		alert("Room link copied to clipboard!");
	};

	if (roomData === undefined || !joined) {
		return (
			<div className="min-h-screen bg-[#1a1c2c] flex items-center justify-center">
				<div className="text-center">
					<div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
					<p className="text-gray-400 font-medium animate-pulse">
						Entering the poker room...
					</p>
				</div>
			</div>
		);
	}

	if (roomData === null) {
		return (
			<div className="min-h-screen bg-[#1a1c2c] flex items-center justify-center">
				<div className="text-center">
					<p className="text-white">Room not found.</p>
				</div>
			</div>
		);
	}

	const players = roomData.players;
	const self = players.find((p) => p._id === playerId);
	const isGM = self?.isGM ?? false;
	const myVote = self?.vote ?? null;
	const revealed = roomData.revealed;
	const maxFib = roomData.maxFib ?? 8;

	const fibCards = FIBONACCI_SEQUENCE.filter((n) => Number(n) <= maxFib);
	const allCards = [...fibCards, ...SPECIAL_CARDS];

	return (
		<div className="min-h-screen bg-[#0f111a] text-gray-100 font-sans selection:bg-blue-500/30 flex flex-col overflow-hidden">
			{/* Header */}
			<header className="bg-[#1a1c2c] border-b border-gray-800 px-4 py-3 flex justify-between items-center z-20 shadow-lg shrink-0">
				<div className="flex items-center space-x-3">
					<div className="bg-blue-600 p-1.5 rounded-lg shadow-inner shrink-0">
						<Spade className="w-4 h-4 text-white" />
					</div>
					<div className="min-w-0">
						<h1 className="text-sm font-bold truncate leading-tight">
							{roomName}
						</h1>
						<div className="flex items-center text-[10px] text-gray-400 leading-tight">
							<span className="w-1.5 h-1.5 rounded-full mr-1 bg-green-500" />
							{players.length} Players
						</div>
					</div>
				</div>

				<div className="flex items-center space-x-2 shrink-0">
					<button
						type="button"
						onClick={copyRoomLink}
						className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-400 transition border border-gray-700"
					>
						<Copy className="w-4 h-4" />
					</button>

					{isGM && (
						<div className="flex space-x-2">
							<button
								type="button"
								onClick={handleReveal}
								disabled={revealed || players.every((p) => !p.vote)}
								className="bg-green-600 hover:bg-green-500 disabled:bg-gray-800 disabled:text-gray-500 px-3 py-1.5 rounded-lg text-xs transition font-bold shadow-lg"
							>
								Reveal
							</button>
							<button
								type="button"
								onClick={handleReset}
								className="bg-red-600 hover:bg-red-500 px-3 py-1.5 rounded-lg text-xs transition font-bold shadow-lg"
							>
								Reset
							</button>
						</div>
					)}
				</div>
			</header>

			{/* Main Content Area - Scrollable */}
			<main className="flex-1 overflow-y-auto p-4 flex flex-col space-y-4 pb-32">
				{/* GM Settings - Max Fib */}
				{isGM && (
					<div className="flex items-center justify-center space-x-4 bg-[#1a1c2c] p-3 rounded-xl border border-gray-800">
						<span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
							Max Fib:
						</span>
						<div className="flex space-x-2">
							{[5, 8, 13, 21].map((num) => (
								<button
									key={num}
									type="button"
									onClick={() => handleSetMaxFib(num)}
									className={`px-3 py-1 rounded-md text-xs font-bold transition ${maxFib === num ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-500 hover:text-gray-300"}`}
								>
									{num}
								</button>
							))}
						</div>
					</div>
				)}

				{/* Consensus Banner */}
				{revealed && (
					<div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-4 text-center shadow-xl shrink-0">
						<h3 className="text-blue-100 font-bold text-[10px] uppercase tracking-widest mb-1">
							Average
						</h3>
						<div className="text-4xl font-black text-white">
							{calculateAverage(players.map((p) => p.vote))}
						</div>
					</div>
				)}

				{/* Participants Grid */}
				<div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
					{players.map((player) => (
						<div
							key={player._id}
							className={`relative flex flex-col items-center p-2 rounded-xl border transition-all ${player._id === playerId ? "bg-blue-600/10 border-blue-500/50" : "bg-[#1a1c2c] border-gray-800"}`}
						>
							<div
								className={`w-12 h-12 rounded-lg flex items-center justify-center mb-1 shadow-inner relative ${player.vote ? "bg-blue-600" : "bg-gray-800"}`}
							>
								<SpaceInvader
									className={`w-8 h-8 ${player.vote ? "text-white" : "text-gray-600"}`}
								/>
								{player.vote && revealed && (
									<div className="absolute inset-0 bg-blue-700 rounded-lg flex items-center justify-center text-lg font-black text-white animate-in zoom-in-50 duration-300">
										{player.vote}
									</div>
								)}
								{player.vote && !revealed && (
									<div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#1a1c2c] flex items-center justify-center">
										<div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
									</div>
								)}
							</div>
							<p className="text-[10px] font-bold truncate w-full text-center text-gray-300">
								{player.nickname} {player._id === playerId && "(You)"}
							</p>
							{player.isGM && (
								<div className="absolute -top-1 -left-1 bg-yellow-500 rounded px-1 py-0.5 shadow-sm">
									<p className="text-[6px] font-black text-black uppercase tracking-tighter">
										GM
									</p>
								</div>
							)}
						</div>
					))}
				</div>
			</main>

			{/* Card Selector - Fixed at bottom */}
			<div className="fixed bottom-0 left-0 right-0 p-4 bg-[#1a1c2c] border-t border-gray-800 z-30 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
				<div className="max-w-md mx-auto">
					<div className="flex justify-between items-center mb-2 px-1">
						<span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
							{revealed ? "Voting Closed" : "Select Your Card"}
						</span>
						{myVote && !revealed && (
							<span className="text-[10px] font-bold text-blue-400 animate-pulse">
								Vote Cast: {myVote}
							</span>
						)}
					</div>
					<div className="grid grid-cols-5 gap-2">
						{allCards.map((card) => (
							<button
								type="button"
								key={card}
								onClick={() => handleVote(card)}
								disabled={revealed}
								className={`
                  h-12 rounded-lg font-black text-lg transition-all duration-200
                  ${
										myVote === card
											? "bg-blue-600 text-white shadow-lg scale-105"
											: "bg-gray-800 text-gray-400 hover:text-white active:bg-gray-700"
									}
                  ${revealed ? "opacity-30 grayscale cursor-not-allowed" : "active:scale-95"}
                `}
							>
								{card}
							</button>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}

function calculateAverage(votes: (string | null)[]) {
	const numericVotes = votes
		.filter((v): v is string => v !== null && !Number.isNaN(Number(v)))
		.map(Number);

	if (numericVotes.length === 0) return "0.0";
	const sum = numericVotes.reduce((a, b) => a + b, 0);
	return (sum / numericVotes.length).toFixed(1);
}

const SpaceInvader = ({ className }: { className?: string }) => (
	<svg
		viewBox="0 0 24 24"
		fill="currentColor"
		className={className}
		aria-label="Space Invader"
		role="img"
	>
		<path d="M6,1H8V3H6V1M16,1H18V3H16V1M7,4H17V5H7V4M6,5H18V6H6V5M5,6H19V7H5V6M4,7H20V12H19V13H18V14H17V15H15V14H13V13H11V14H9V15H7V14H6V13H5V12H4V7M8,8H9V11H8V8M15,8H16V11H15V8M2,11H3V14H5V15H2V11M21,11H22V14H19V15H21V11Z" />
	</svg>
);

const Spade = ({ className }: { className?: string }) => (
	<svg
		viewBox="0 0 24 24"
		fill="currentColor"
		stroke="none"
		className={className}
		aria-label="Spade Icon"
		role="img"
	>
		<title>Spade Icon</title>
		<path d="M12 2C9.5 2 7.5 4 7.5 6.5C7.5 7.8 8.1 8.9 9 9.7C7.3 10.5 6 12.1 6 14C6 16.8 8.2 19 11 19V22H13V19C15.8 19 18 16.8 18 14C18 12.1 16.7 10.5 15 9.7C15.9 8.9 16.5 7.8 16.5 6.5C16.5 4 14.5 2 12 2Z" />
	</svg>
);
