import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
		<div className="min-h-screen flex items-center justify-center bg-gray-100">
			<div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
				<h1 className="text-2xl font-bold mb-6 text-center text-blue-600">
					Planning Poker
				</h1>
				<div className="space-y-4">
					<div>
						<label
							htmlFor="nickname"
							className="block text-sm font-medium text-gray-700"
						>
							Nickname
						</label>
						<input
							type="text"
							id="nickname"
							value={nickname}
							onChange={(e) => setNickname(e.target.value)}
							className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
							placeholder="Enter your nickname"
						/>
					</div>
					<div>
						<label
							htmlFor="roomId"
							className="block text-sm font-medium text-gray-700"
						>
							Room Name
						</label>
						<input
							type="text"
							id="roomId"
							value={roomId}
							onChange={(e) => setRoomId(e.target.value)}
							className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
							placeholder="Enter room name"
						/>
					</div>
					<button
						onClick={handleJoin}
						disabled={!nickname || !roomId}
						className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700 transition duration-300 disabled:bg-gray-400"
					>
						Join Room
					</button>
				</div>
			</div>
		</div>
	);
}
