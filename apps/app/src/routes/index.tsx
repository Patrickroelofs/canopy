import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { renderTree } from "@/components/tree-renderer";
import { buildChildrenMap } from "@/lib/build-tree-map";
import { client } from "@/orpc/client";

export const Route = createFileRoute("/")({ component: App });

function App() {
	const { data } = useQuery({
		queryKey: ["nodes", "all"],
		queryFn: () => client.nodeRouter.list(),
	});

	const dataTree = useMemo(() => buildChildrenMap(data ?? []), [data]);

	return (
		<div className="h-screen w-screen">
			<h1>Canopy</h1>
			{renderTree(dataTree, null, 0)}
		</div>
	);
}
