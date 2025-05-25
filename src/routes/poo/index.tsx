import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/poo/")({
	component: RouteComponent,
});

function RouteComponent() {
	return <div>Hello "/poo/"!</div>;
}
