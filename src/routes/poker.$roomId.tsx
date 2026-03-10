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

const FIBONACCI_CARDS = ["0", "1", "2", "3", "5", "8", "13", "21", "?", "☕"];

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

	const [playerId, setPlayerId] = useState<string | null>(null);
	const [joined, setJoined] = useState(false);

	useEffect(() => {
		if (!joined && roomData !== undefined) {
			joinRoom({ roomName, nickname }).then(({ playerId }) => {
				setPlayerId(playerId);
				setJoined(true);
			});
		}
	}, [joined, roomData, roomName, nickname, joinRoom]);

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

	return (
		<div className="min-h-screen bg-[#0f111a] text-gray-100 font-sans selection:bg-blue-500/30">
			{/* Header */}
			<header className="bg-[#1a1c2c] border-b border-gray-800 px-6 py-4 flex flex-wrap justify-between items-center sticky top-0 z-20 shadow-lg">
				<div className="flex items-center space-x-4">
					<div className="bg-green-600 p-2 rounded-lg shadow-inner">
						<Info className="w-5 h-5 text-white" />
					</div>
					<div>
						<h1 className="text-lg font-bold tracking-tight">{roomName}</h1>
						<div className="flex items-center text-xs text-gray-400">
							<span className="w-2 h-2 rounded-full mr-1.5 bg-green-500" />
							Live • {players.length} Players
						</div>
					</div>
				</div>

				<div className="flex items-center space-x-3 mt-4 sm:mt-0">
					<button
						type="button"
						onClick={copyRoomLink}
						className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-lg text-sm transition font-medium border border-gray-700"
					>
						<Copy className="w-4 h-4" />
						<span>Copy Link</span>
					</button>

					{isGM && (
						<div className="flex space-x-2">
							<button
								type="button"
								onClick={handleReveal}
								disabled={revealed || players.every((p) => !p.vote)}
								className="flex items-center space-x-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-800 disabled:text-gray-500 px-4 py-2 rounded-lg text-sm transition font-bold shadow-lg shadow-green-900/20"
							>
								<Eye className="w-4 h-4" />
								<span>Reveal</span>
							</button>
							<button
								type="button"
								onClick={handleReset}
								className="flex items-center space-x-2 bg-red-600 hover:bg-red-500 px-4 py-2 rounded-lg text-sm transition font-bold shadow-lg shadow-red-900/20"
							>
								<RefreshCw className="w-4 h-4" />
								<span>Reset</span>
							</button>
						</div>
					)}
				</div>
			</header>

			<main className="p-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
				<aside className="lg:col-span-1 space-y-6">
					<div className="bg-[#1a1c2c] rounded-2xl overflow-hidden shadow-xl border border-gray-800">
						<div className="px-5 py-4 border-b border-gray-800 bg-[#24273a] flex items-center justify-between">
							<div className="flex items-center space-x-2">
								<Users className="w-5 h-5 text-blue-400" />
								<h2 className="font-bold">Participants</h2>
							</div>
						</div>
						<ul className="divide-y divide-gray-800/50">
							{players.map((player) => (
								<li
									key={player._id}
									className={`px-5 py-4 flex items-center justify-between ${player._id === playerId ? "bg-blue-500/5" : ""}`}
								>
									<div className="flex items-center space-x-3">
										<div
											className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${player._id === playerId ? "bg-blue-600" : "bg-gray-700"} shadow-md`}
										>
											{player.nickname[0].toUpperCase()}
										</div>
										<div>
											<p
												className={`text-sm font-semibold ${player._id === playerId ? "text-blue-400" : "text-gray-200"}`}
											>
												{player.nickname}{" "}
												{player._id === playerId && "(You)"}
											</p>
											{player.isGM && (
												<span className="text-[10px] text-yellow-500 font-bold uppercase tracking-wider">
													Game Master
												</span>
											)}
										</div>
									</div>
									<div className="flex items-center">
										{player.vote ? (
											revealed ? (
												<div className="w-8 h-10 bg-blue-600 rounded flex items-center justify-center font-bold text-white shadow-lg transform rotate-3">
													{player.vote}
												</div>
											) : (
												<div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
													<div className="w-2.5 h-2.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
												</div>
											)
										) : (
											<div className="w-8 h-8 bg-gray-800/50 rounded-full flex items-center justify-center">
												<span className="text-[10px] text-gray-500 animate-pulse font-bold">
													...
												</span>
											</div>
										)}
									</div>
								</li>
							))}
						</ul>
					</div>
				</aside>

				<section className="lg:col-span-3 space-y-8">
					{revealed && (
						<div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-center shadow-2xl relative overflow-hidden group">
							<div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
							<div className="relative z-10">
								<h3 className="text-blue-100 font-bold text-sm uppercase tracking-[0.2em] mb-2">
									Final Consensus
								</h3>
								<div className="text-6xl font-black text-white mb-2 drop-shadow-lg">
									{calculateAverage(players.map((p) => p.vote))}
								</div>
								<p className="text-blue-100/80 text-sm font-medium">
									Average Story Points
								</p>
							</div>
							<div className="absolute -bottom-6 -right-6 opacity-10 transform group-hover:scale-110 transition duration-700">
								<Spade className="w-32 h-32" />
							</div>
						</div>
					)}

					<div className="bg-[#1a1c2c] rounded-3xl p-8 border border-gray-800 shadow-xl relative">
						<div className="absolute -top-4 left-10 bg-[#0f111a] px-4 py-1 rounded-full border border-gray-800">
							<span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
								Select Your Card
							</span>
						</div>

						<div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
							{FIBONACCI_CARDS.map((card) => (
								<button
									type="button"
									key={card}
									onClick={() => handleVote(card)}
									disabled={revealed}
									className={`
                    relative aspect-[2/3] rounded-xl border-2 font-black text-3xl transition-all duration-300
                    flex flex-col items-center justify-center overflow-hidden
                    ${
											myVote === card
												? "bg-blue-600 border-white text-white shadow-[0_0_25px_rgba(37,99,235,0.4)] scale-105 z-10"
												: "bg-[#24273a] border-gray-700 text-gray-400 hover:border-blue-500/50 hover:bg-[#2a2d3e] hover:text-white"
										}
                    ${revealed ? "opacity-40 grayscale cursor-not-allowed scale-95" : "hover:-translate-y-2 active:scale-95"}
                  `}
								>
									<span
										className={`absolute top-2 left-2 text-sm ${myVote === card ? "opacity-50" : "opacity-20"}`}
									>
										{card}
									</span>
									<span className="relative z-10">{card}</span>
									<span
										className={`absolute bottom-2 right-2 text-sm rotate-180 ${myVote === card ? "opacity-50" : "opacity-20"}`}
									>
										{card}
									</span>

									{myVote === card && (
										<div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent" />
									)}
								</button>
							))}
						</div>
					</div>

					<div className="hidden lg:block h-64 bg-green-900/10 rounded-[100px] border-4 border-green-800/20 flex items-center justify-center relative shadow-inner overflow-hidden">
						<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(0,0,0,0.4)_100%)]" />
						<Spade className="w-20 h-20 text-green-800/20" />

						<div className="absolute w-full h-full flex items-center justify-center">
							{players.map((player, index) => {
								const angle = (index / players.length) * 2 * Math.PI;
								const x = Math.cos(angle) * 180;
								const y = Math.sin(angle) * 80;
								return (
									<div
										key={player._id}
										className="absolute transition-all duration-500"
										style={{ transform: `translate(${x}px, ${y}px)` }}
									>
										<div
											className={`w-12 h-12 rounded-full border-2 border-gray-800 flex items-center justify-center text-xs font-bold shadow-lg overflow-hidden ${player.vote ? "bg-green-600 border-green-400" : "bg-gray-700"}`}
										>
											{player.vote && !revealed
												? "?"
												: player.nickname[0].toUpperCase()}
										</div>
										<div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold text-gray-500 uppercase tracking-tighter">
											{player.nickname}
										</div>
									</div>
								);
							})}
						</div>
					</div>
				</section>
			</main>
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
