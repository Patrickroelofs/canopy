import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { routeTree } from "@/routeTree.gen";
import { getContext } from "./lib/root-provider";

export function getRouter() {
	const router = createTanStackRouter({
		routeTree,

		context: getContext(),
	});

	return router;
}

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof getRouter>;
	}
}
