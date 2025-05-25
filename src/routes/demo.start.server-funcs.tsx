import { Button } from "@/components/ui/button";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

// Create a persistent store for the count
// Extend globalThis to include countStore for type safety
declare global {
	// eslint-disable-next-line no-var
	var countStore: number;
}

if (!globalThis.countStore) {
	globalThis.countStore = 22;
}
countStore = globalThis.countStore;

async function readCount() {
	return countStore;
}

async function incrementCount(increment: number) {
	countStore += increment;
	return countStore;
}

const getCount = createServerFn({
	method: "GET",
}).handler(() => {
	return readCount();
});

const updateCount = createServerFn({ method: "POST" })
	.validator((d: number) => d)
	.handler(async ({ data }) => {
		return incrementCount(data);
	});

export const Route = createFileRoute("/demo/start/server-funcs")({
	component: Home,
	loader: async () => await getCount(),
});

function Home() {
	const router = useRouter();
	const state = Route.useLoaderData();

	return (
		<div className="p-4">
			<Button
				onClick={() => {
					updateCount({ data: 1 }).then(() => {
						router.invalidate();
					});
				}}
				className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
			>
				Add 1 to {state}?
			</Button>
		</div>
	);
}
