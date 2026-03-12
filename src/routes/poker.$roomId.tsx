import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { Check, Copy, Eye, LogOut, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { api } from "../../convex/_generated/api";

export const Route = createFileRoute("/poker/$roomId")({
	component: PokerRoom,
});

const FIBONACCI_SEQUENCE = ["0", "1", "2", "3", "5", "8", "13", "21"];
const SPECIAL_CARDS = ["?", "☕"];

function PokerRoom() {
	const { roomId: roomName } = Route.useParams();
	const [nickname, setNickname] = useState<string | null>(() => {
		if (typeof window !== "undefined") {
			return localStorage.getItem("poker_nickname");
		}
		return null;
	});

	const roomData = useQuery(api.poker.getRoom, { name: roomName });
	const joinRoom = useMutation(api.poker.joinRoom);
	const voteMutation = useMutation(api.poker.vote);
	const revealMutation = useMutation(api.poker.reveal);
	const resetMutation = useMutation(api.poker.reset);
	const heartbeatMutation = useMutation(api.poker.heartbeat);
	const cleanOldPlayersMutation = useMutation(api.poker.cleanOldPlayers);
	const setMaxFibMutation = useMutation(api.poker.setMaxFib);
	const leaveRoomMutation = useMutation(api.poker.leaveRoom);

	const [playerId, setPlayerId] = useState<any>(() => {
		if (typeof window !== "undefined") {
			return localStorage.getItem(`poker_playerId_${roomName}`);
		}
		return null;
	});
	const [joined, setJoined] = useState(false);
	const [joinError, setJoinError] = useState<string | null>(null);
	const [copied, setCopied] = useState(false);
	const trayRef = useRef<HTMLDivElement>(null);
	const [trayHeight, setTrayHeight] = useState(160);

	const navigate = Route.useNavigate();

	// Measure tray height for correct scroll padding
	useEffect(() => {
		if (!trayRef.current) return;
		const obs = new ResizeObserver(() => {
			if (trayRef.current) setTrayHeight(trayRef.current.offsetHeight);
		});
		obs.observe(trayRef.current);
		return () => obs.disconnect();
	}, []);

	useEffect(() => {
		if (!joined && roomData !== undefined && nickname) {
			joinRoom({ roomName, nickname, playerId: playerId || undefined })
				.then(({ playerId: newPlayerId }) => {
					setPlayerId(newPlayerId);
					setJoined(true);
					localStorage.setItem(`poker_playerId_${roomName}`, newPlayerId);
				})
				.catch((err) => {
					if (err.message.includes("Nickname is already taken")) {
						setJoinError("taken");
					}
				});
		}
	}, [joined, roomData, roomName, nickname, joinRoom, playerId]);

	useEffect(() => {
		if (joinError === "taken") {
			navigate({
				to: "/",
				search: { roomId: roomName, error: "Nickname is already taken" },
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
		if (playerId) voteMutation({ playerId: playerId as any, vote });
	};

	const handleReveal = () => {
		if (roomData?._id) revealMutation({ roomId: roomData._id, revealed: true });
	};

	const handleReset = () => {
		if (roomData?._id) resetMutation({ roomId: roomData._id });
	};

	const handleSetMaxFib = (max: number) => {
		if (roomData?._id && isGM)
			setMaxFibMutation({ roomId: roomData._id, maxFib: max });
	};

	const handleSetNickname = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const newNickname = formData.get("nickname") as string;
		if (newNickname.trim()) {
			localStorage.setItem("poker_nickname", newNickname.trim());
			setNickname(newNickname.trim());
		}
	};

	const handleExitRoom = async () => {
		if (playerId) await leaveRoomMutation({ playerId: playerId as any });
		localStorage.removeItem(`poker_playerId_${roomName}`);
		navigate({ to: "/" });
	};

	const copyRoomLink = () => {
		navigator.clipboard.writeText(window.location.href);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	// ── Nickname entry ──────────────────────────────────────────────────────────
	if (!nickname) {
		return (
			<div className="min-h-screen bg-[#070a13] flex items-center justify-center p-5 pt-safe pb-safe">
				<div
					className="absolute inset-0 pointer-events-none"
					style={{
						backgroundImage: `linear-gradient(rgba(99,102,241,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.05) 1px, transparent 1px)`,
						backgroundSize: "52px 52px",
					}}
				/>
				<div className="relative bg-[#0d1120] border border-slate-800/70 p-6 rounded-2xl shadow-2xl w-full max-w-sm">
					<div className="flex justify-center mb-5">
						<div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-3 rounded-xl shadow-lg">
							<SpadeIcon className="w-6 h-6 text-white" />
						</div>
					</div>
					<h2 className="text-lg font-black text-white text-center mb-1">
						Join <span className="text-indigo-400">{roomName}</span>
					</h2>
					<p className="text-slate-600 text-xs text-center mb-6">
						Enter your name to continue
					</p>
					<form onSubmit={handleSetNickname} className="space-y-3">
						<input
							type="text"
							name="nickname"
							autoFocus
							className="w-full h-12 bg-[#070a13] text-white rounded-xl border border-slate-800 focus:border-indigo-500 px-4 transition-colors outline-none placeholder-slate-700 text-sm font-medium no-tap-highlight"
							placeholder="Your name"
							required
						/>
						<button
							type="submit"
							className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all active:scale-[0.97] text-sm no-tap-highlight"
						>
							Join Room
						</button>
					</form>
				</div>
			</div>
		);
	}

	// ── Loading ─────────────────────────────────────────────────────────────────
	if (roomData === undefined || !joined) {
		return (
			<div className="min-h-screen bg-[#070a13] flex items-center justify-center">
				<div className="text-center space-y-4">
					<div className="relative mx-auto w-12 h-12">
						<div className="absolute inset-0 rounded-full border-[3px] border-slate-800" />
						<div className="absolute inset-0 rounded-full border-[3px] border-indigo-500 border-t-transparent animate-spin" />
					</div>
					<p className="text-slate-600 text-sm font-medium">Joining room…</p>
				</div>
			</div>
		);
	}

	// ── Room not found ──────────────────────────────────────────────────────────
	if (roomData === null) {
		return (
			<div className="min-h-screen bg-[#070a13] flex items-center justify-center">
				<div className="text-center space-y-3">
					<p className="text-slate-300 font-bold">Room not found</p>
					<button
						type="button"
						onClick={() => navigate({ to: "/" })}
						className="text-indigo-400 hover:text-indigo-300 text-sm underline underline-offset-2 transition-colors"
					>
						Back to home
					</button>
				</div>
			</div>
		);
	}

	// ── Derived state ───────────────────────────────────────────────────────────
	const players = roomData.players;
	const self = players.find((p) => p._id === playerId);
	const isGM = self?.isGM ?? false;
	const myVote = self?.vote ?? null;
	const revealed = roomData.revealed;
	const maxFib = roomData.maxFib ?? 8;
	const votedCount = players.filter((p) => p.vote).length;
	const allVoted = players.length > 0 && votedCount === players.length;

	const fibCards = FIBONACCI_SEQUENCE.filter((n) => Number(n) <= maxFib);
	const allCards = [...fibCards, ...SPECIAL_CARDS];

	// Vote distribution for reveal screen
	const voteDistribution = revealed
		? buildDistribution(players.map((p) => p.vote))
		: null;
	const average = revealed
		? calculateAverage(players.map((p) => p.vote))
		: null;

	// ── Main room UI ────────────────────────────────────────────────────────────
	return (
		<div className="h-[100dvh] bg-[#070a13] text-slate-100 flex flex-col overflow-hidden">
			{/* ── Header ─────────────────────────────────────────────────────── */}
			<header
				className="shrink-0 bg-[#0d1120]/95 backdrop-blur-md border-b border-slate-800/60 flex items-center justify-between gap-2 px-4"
				style={{
					paddingTop: `calc(env(safe-area-inset-top) + 10px)`,
					paddingBottom: "10px",
					paddingLeft: `calc(env(safe-area-inset-left) + 16px)`,
					paddingRight: `calc(env(safe-area-inset-right) + 16px)`,
				}}
			>
				{/* Left: logo + room name */}
				<div className="flex items-center gap-2.5 min-w-0">
					<div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-1.5 rounded-lg shrink-0">
						<SpadeIcon className="w-4 h-4 text-white" />
					</div>
					<div className="min-w-0">
						<h1 className="text-sm font-black text-white truncate leading-tight">
							{roomName}
						</h1>
						<div className="flex items-center gap-1 text-[10px] text-slate-500 leading-tight">
							<span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
							{players.length}{" "}
							{players.length === 1 ? "player" : "players"}
						</div>
					</div>
				</div>

				{/* Right: actions */}
				<div className="flex items-center gap-1 shrink-0">
					<button
						type="button"
						onClick={handleExitRoom}
						title="Leave room"
						className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors no-tap-highlight"
					>
						<LogOut className="w-4 h-4" />
					</button>
					<button
						type="button"
						onClick={copyRoomLink}
						title="Copy room link"
						className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors no-tap-highlight"
					>
						{copied ? (
							<Check className="w-4 h-4 text-emerald-400" />
						) : (
							<Copy className="w-4 h-4" />
						)}
					</button>
				</div>
			</header>

			{/* ── Scrollable content ──────────────────────────────────────────── */}
			<main
				className="flex-1 overflow-y-auto ios-scroll"
				style={{ paddingBottom: `${trayHeight + 8}px` }}
			>
				<div className="px-4 pt-4 space-y-3">
					{/* Vote progress bar */}
					{!revealed && (
						<div className="flex items-center gap-3">
							<div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
								<div
									className="h-full bg-gradient-to-r from-indigo-600 to-violet-500 rounded-full transition-all duration-700"
									style={{
										width: `${players.length ? (votedCount / players.length) * 100 : 0}%`,
									}}
								/>
							</div>
							<span className="text-[10px] font-bold text-slate-600 shrink-0 tabular-nums">
								{votedCount}/{players.length} voted
							</span>
						</div>
					)}

					{/* Result banner */}
					{revealed && voteDistribution && (
						<ResultBanner
							average={average!}
							distribution={voteDistribution}
						/>
					)}

					{/* Players grid */}
					<div className="grid grid-cols-3 gap-2.5">
						{players.map((player) => {
							const isMe = player._id === playerId;
							const hasVoted = !!player.vote;
							const showVote = revealed && player.vote !== null;

							return (
								<div
									key={player._id}
									className={`relative flex flex-col rounded-2xl border overflow-hidden transition-all duration-300 ${
										isMe
											? "border-indigo-500/50 shadow-lg shadow-indigo-500/10"
											: showVote
												? "border-slate-300/15"
												: "border-slate-800/70"
									} ${showVote ? "bg-white" : "bg-[#0d1120]"}`}
								>
									{/* GM badge */}
									{player.isGM && (
										<div className="absolute top-1.5 left-1.5 z-10 bg-amber-400 text-black text-[7px] font-black uppercase tracking-tight px-1.5 py-0.5 rounded-md leading-none">
											GM
										</div>
									)}

									{/* Avatar / vote */}
									<div className="flex flex-1 items-center justify-center py-4 min-h-[72px]">
										{showVote ? (
											<span className="text-3xl font-black text-slate-800 leading-none">
												{player.vote}
											</span>
										) : (
											<div className="relative">
												<SpaceInvader
													className={`w-9 h-9 transition-colors ${
														hasVoted ? "text-indigo-400" : "text-slate-800"
													}`}
												/>
												{hasVoted && !revealed && (
													<span className="absolute -top-1 -right-1 flex h-3 w-3">
														<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
														<span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-[#0d1120]" />
													</span>
												)}
											</div>
										)}
									</div>

									{/* Name */}
									<div
										className={`px-2 pb-2.5 text-center ${showVote ? "bg-white" : ""}`}
									>
										<p
											className={`text-[9px] font-bold truncate leading-tight ${
												showVote
													? "text-slate-400"
													: isMe
														? "text-indigo-400"
														: "text-slate-600"
											}`}
										>
											{player.nickname}
											{isMe && " · me"}
										</p>
									</div>
								</div>
							);
						})}
					</div>
				</div>
			</main>

			{/* ── Fixed bottom tray ───────────────────────────────────────────── */}
			<div
				ref={trayRef}
				className="absolute bottom-0 left-0 right-0 z-30 bg-[#0d1120]/96 backdrop-blur-md border-t border-slate-800/60"
				style={{
					paddingLeft: `calc(env(safe-area-inset-left) + 16px)`,
					paddingRight: `calc(env(safe-area-inset-right) + 16px)`,
					paddingBottom: `calc(env(safe-area-inset-bottom) + 20px)`,
					paddingTop: "12px",
				}}
			>
				{/* GM controls row */}
				{isGM && (
					<div className="flex items-center gap-2 mb-3">
						{/* Scale picker */}
						<div className="flex items-center gap-1.5 flex-1">
							<span className="text-[9px] font-bold text-slate-700 uppercase tracking-widest shrink-0">
								Max
							</span>
							{[5, 8, 13, 21].map((num) => (
								<button
									key={num}
									type="button"
									onClick={() => handleSetMaxFib(num)}
									className={`h-7 px-2.5 rounded-lg text-xs font-bold transition-colors no-tap-highlight ${
										maxFib === num
											? "bg-indigo-600 text-white shadow-sm"
											: "text-slate-600 hover:text-slate-400 bg-slate-800/60 hover:bg-slate-800"
									}`}
								>
									{num}
								</button>
							))}
						</div>

						{/* Reveal / Reset */}
						<div className="flex gap-1.5">
							<button
								type="button"
								onClick={handleReveal}
								disabled={revealed || votedCount === 0}
								className="h-8 flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-700 text-white text-xs font-bold px-3 rounded-lg transition-colors shadow-sm no-tap-highlight"
							>
								<Eye className="w-3.5 h-3.5 shrink-0" />
								{allVoted ? "Reveal!" : "Reveal"}
							</button>
							<button
								type="button"
								onClick={handleReset}
								className="h-8 w-8 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-500 hover:text-slate-300 rounded-lg transition-colors no-tap-highlight"
								title="Reset votes"
							>
								<RotateCcw className="w-3.5 h-3.5" />
							</button>
						</div>
					</div>
				)}

				{/* Card label */}
				<div className="flex items-center justify-between mb-2.5">
					<span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">
						{revealed ? "Voting closed" : "Pick a card"}
					</span>
					{myVote && !revealed && (
						<span className="text-[10px] font-bold text-indigo-400 tabular-nums">
							Selected: <span className="text-indigo-300">{myVote}</span>
						</span>
					)}
				</div>

				{/* Cards */}
				<div className="grid grid-cols-5 gap-2">
					{allCards.map((card) => {
						const isSelected = myVote === card;
						return (
							<button
								type="button"
								key={card}
								onClick={() => handleVote(card)}
								disabled={revealed}
								className={`relative h-14 rounded-xl text-lg font-black transition-all duration-150 border select-none no-tap-highlight ${
									isSelected
										? "bg-indigo-600 text-white border-indigo-400/60 shadow-lg shadow-indigo-500/30 -translate-y-2 scale-105 z-10"
										: revealed
											? "bg-[#0d1120] text-slate-800 border-slate-800/40 cursor-not-allowed"
											: "bg-slate-100 text-slate-800 border-slate-200/10 shadow-md hover:-translate-y-1 hover:bg-white active:scale-95"
								}`}
							>
								{card}
							</button>
						);
					})}
				</div>
			</div>
		</div>
	);
}

// ── Result banner with distribution ────────────────────────────────────────
type Distribution = { value: string; count: number; isNumeric: boolean }[];

function ResultBanner({
	average,
	distribution,
}: {
	average: string;
	distribution: Distribution;
}) {
	const maxCount = Math.max(...distribution.map((d) => d.count));

	return (
		<div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-600/12 to-violet-600/8 p-4">
			<div
				className="absolute inset-0 pointer-events-none"
				style={{
					backgroundImage: `radial-gradient(circle at 50% 0%, rgba(99,102,241,0.15) 0%, transparent 55%)`,
				}}
			/>

			{/* Average */}
			<div className="relative text-center mb-4">
				<p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mb-1">
					Average
				</p>
				<div className="text-5xl font-black text-white leading-none">
					{average}
				</div>
			</div>

			{/* Distribution bars */}
			{distribution.length > 0 && (
				<div className="relative flex items-end justify-center gap-2">
					{distribution.map((item) => {
						const pct = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
						return (
							<div key={item.value} className="flex flex-col items-center gap-1">
								<span className="text-[9px] font-bold text-slate-400 tabular-nums">
									{item.count}
								</span>
								<div className="w-8 bg-slate-800 rounded-t-md overflow-hidden flex flex-col justify-end" style={{ height: 32 }}>
									<div
										className={`w-full rounded-t-md transition-all duration-700 ${
											item.isNumeric
												? "bg-gradient-to-t from-indigo-700 to-indigo-500"
												: "bg-slate-700"
										}`}
										style={{
											height: `${Math.max(pct, 10)}%`,
										}}
									/>
								</div>
								<span className="text-[10px] font-black text-slate-400">
									{item.value}
								</span>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function calculateAverage(votes: (string | null)[]): string {
	const numericVotes = votes
		.filter((v): v is string => v !== null && !Number.isNaN(Number(v)))
		.map(Number);

	if (numericVotes.length === 0) return "—";
	const sum = numericVotes.reduce((a, b) => a + b, 0);
	return (sum / numericVotes.length).toFixed(1);
}

function buildDistribution(votes: (string | null)[]): Distribution {
	const counts = new Map<string, number>();
	for (const v of votes) {
		if (v !== null) {
			counts.set(v, (counts.get(v) ?? 0) + 1);
		}
	}
	return Array.from(counts.entries())
		.map(([value, count]) => ({
			value,
			count,
			isNumeric: !Number.isNaN(Number(value)),
		}))
		.sort((a, b) => {
			if (a.isNumeric && b.isNumeric) return Number(a.value) - Number(b.value);
			if (a.isNumeric) return -1;
			if (b.isNumeric) return 1;
			return a.value.localeCompare(b.value);
		});
}

// ── SVG Icons ───────────────────────────────────────────────────────────────
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

const SpadeIcon = ({ className }: { className?: string }) => (
	<svg
		viewBox="0 0 24 24"
		fill="currentColor"
		className={className}
		aria-label="Spade"
		role="img"
	>
		<title>Spade</title>
		<path d="M12 2C9.5 2 7.5 4 7.5 6.5C7.5 7.8 8.1 8.9 9 9.7C7.3 10.5 6 12.1 6 14C6 16.8 8.2 19 11 19V22H13V19C15.8 19 18 16.8 18 14C18 12.1 16.7 10.5 15 9.7C15.9 8.9 16.5 7.8 16.5 6.5C16.5 4 14.5 2 12 2Z" />
	</svg>
);
