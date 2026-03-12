import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";

const landingSearchSchema = z.object({
	roomId: z.string().optional(),
	error: z.string().optional(),
});

export const Route = createFileRoute("/")({
	component: LandingPage,
	validateSearch: landingSearchSchema,
});

function LandingPage() {
	const { roomId: initialRoomId, error } = Route.useSearch();
	const [nickname, setNickname] = useState(() => {
		if (typeof window !== "undefined") {
			return localStorage.getItem("poker_nickname") ?? "";
		}
		return "";
	});
	const [roomId, setRoomId] = useState(initialRoomId ?? "");
	const navigate = useNavigate();
	const nicknameRef = useRef<HTMLInputElement>(null);
	const roomRef = useRef<HTMLInputElement>(null);

	// Auto-focus the empty field
	useEffect(() => {
		if (!nickname) {
			nicknameRef.current?.focus();
		} else if (!roomId) {
			roomRef.current?.focus();
		}
	}, []);

	const canSubmit = nickname.trim().length > 0 && roomId.trim().length > 0;

	const handleJoin = () => {
		if (!canSubmit) return;
		const trimmedNickname = nickname.trim();
		const trimmedRoomId = roomId.trim();
		localStorage.setItem("poker_nickname", trimmedNickname);
		navigate({
			to: "/poker/$roomId",
			params: { roomId: trimmedRoomId },
		});
	};

	return (
		<div className="min-h-screen flex flex-col items-center justify-center bg-[#070a13] relative overflow-hidden p-5 pt-safe">
			{/* Subtle grid */}
			<div
				className="absolute inset-0 pointer-events-none"
				style={{
					backgroundImage: `linear-gradient(rgba(99,102,241,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.06) 1px, transparent 1px)`,
					backgroundSize: "52px 52px",
				}}
			/>

			{/* Radial glow */}
			<div
				className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] pointer-events-none"
				style={{
					background:
						"radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 60%)",
				}}
			/>

			<div className="relative w-full max-w-[360px]">
				{/* Logo block */}
				<div className="flex flex-col items-center mb-10">
					<div className="relative mb-5">
						<div
							className="absolute -inset-3 rounded-3xl blur-2xl opacity-70"
							style={{ background: "rgba(99,102,241,0.5)" }}
						/>
						<div className="relative bg-gradient-to-br from-indigo-500 to-violet-600 p-4 rounded-2xl shadow-2xl">
							<SpadeIcon className="w-10 h-10 text-white" />
						</div>
					</div>
					<h1 className="text-3xl font-black text-white tracking-tight leading-none mb-2">
						Planning Poker
					</h1>
					<p className="text-slate-500 text-sm text-center leading-snug">
						Estimate story points together, in real time
					</p>
				</div>

				{/* Card */}
				<div className="bg-[#0d1120] border border-slate-800/70 rounded-2xl p-5 shadow-2xl">
					<form
						onSubmit={(e) => {
							e.preventDefault();
							handleJoin();
						}}
						className="space-y-4"
					>
						{/* Nickname */}
						<div className="space-y-1.5">
							<label
								htmlFor="nickname"
								className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest"
							>
								Your Name
							</label>
							<input
								ref={nicknameRef}
								type="text"
								id="nickname"
								value={nickname}
								onChange={(e) => setNickname(e.target.value)}
								className={`w-full bg-[#070a13] text-white rounded-xl border ${
									error
										? "border-red-500/60 focus:border-red-400"
										: "border-slate-800 focus:border-indigo-500"
								} px-4 py-3.5 h-12 transition-colors outline-none placeholder-slate-700 text-sm font-medium no-tap-highlight`}
								placeholder="e.g. Alex"
								autoComplete="nickname"
								enterKeyHint="next"
							/>
							{error && (
								<div className="flex items-center gap-1.5 mt-1">
									<span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
									<p className="text-red-400 text-xs font-medium">{error}</p>
								</div>
							)}
						</div>

						{/* Room */}
						<div className="space-y-1.5">
							<label
								htmlFor="roomId"
								className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest"
							>
								Room
							</label>
							<input
								ref={roomRef}
								type="text"
								id="roomId"
								value={roomId}
								onChange={(e) => setRoomId(e.target.value)}
								className="w-full bg-[#070a13] text-white rounded-xl border border-slate-800 focus:border-indigo-500 px-4 py-3.5 h-12 transition-colors outline-none placeholder-slate-700 text-sm font-medium no-tap-highlight"
								placeholder="e.g. Sprint-42"
								autoComplete="off"
								autoCapitalize="none"
								enterKeyHint="go"
							/>
						</div>

						{/* Submit */}
						<button
							type="submit"
							disabled={!canSubmit}
							className="w-full h-12 mt-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800/80 disabled:text-slate-600 text-white font-bold rounded-xl transition-all duration-150 active:scale-[0.97] disabled:active:scale-100 text-sm tracking-wide shadow-lg shadow-indigo-900/40 disabled:shadow-none no-tap-highlight"
						>
							Enter Room →
						</button>
					</form>
				</div>

				<p className="text-center text-slate-700 text-xs mt-4">
					A new room is created automatically
				</p>
			</div>
		</div>
	);
}

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
