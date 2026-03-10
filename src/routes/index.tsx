import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Spade } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/")({
	component: LandingPage,
});

function LandingPage() {
	const [nickname, setNickname] = useState("");
	const [roomId, setRoomId] = useState("");
	const navigate = useNavigate();

	const handleJoin = () => {
		if (nickname && roomId) {
			navigate({
				to: "/poker/$roomId",
				params: { roomId },
				search: { nickname },
			});
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-[#1a1c2c] bg-[radial-gradient(circle_at_center,_#2a2d3e_0%,_#1a1c2c_100%)]">
			<div className="bg-[#2a2d3e] p-10 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700">
				<div className="flex justify-center mb-6">
					<div className="bg-blue-600 p-4 rounded-full shadow-lg shadow-blue-900/50">
						<Spade className="w-10 h-10 text-white" />
					</div>
				</div>
				<h1 className="text-3xl font-extrabold mb-8 text-center text-white tracking-tight">
					Planning Poker
				</h1>
				<div className="space-y-6">
					<div>
						<label
							htmlFor="nickname"
							className="block text-sm font-semibold text-gray-400 mb-2 ml-1"
						>
							Nickname
						</label>
						<input
							type="text"
							id="nickname"
							value={nickname}
							onChange={(e) => setNickname(e.target.value)}
							className="w-full bg-[#1a1c2c] text-white rounded-xl border-2 border-gray-700 focus:border-blue-500 focus:ring-0 p-3.5 transition-all outline-none"
							placeholder="Your name"
						/>
					</div>
					<div>
						<label
							htmlFor="roomId"
							className="block text-sm font-semibold text-gray-400 mb-2 ml-1"
						>
							Room Name
						</label>
						<input
							type="text"
							id="roomId"
							value={roomId}
							onChange={(e) => setRoomId(e.target.value)}
							className="w-full bg-[#1a1c2c] text-white rounded-xl border-2 border-gray-700 focus:border-blue-500 focus:ring-0 p-3.5 transition-all outline-none"
							placeholder="e.g. Sprint-42"
						/>
					</div>
					<button
						type="button"
						onClick={handleJoin}
						disabled={!nickname || !roomId}
						className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-500 transition duration-300 disabled:bg-gray-700 disabled:text-gray-500 shadow-lg shadow-blue-600/20 active:scale-95 transform disabled:scale-100"
					>
						Enter Room
					</button>
				</div>
			</div>
		</div>
	);
}
