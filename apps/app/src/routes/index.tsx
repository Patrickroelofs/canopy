import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { CreateNewNode } from "@/components/nodes/create-new-node";
import { renderTree } from "@/components/tree-renderer";
import type { Node } from "@/db/schemas/node-schema";
import { buildChildrenMap } from "@/lib/build-tree-map";
import { getApplicationContext } from "@/lib/root-provider";
import { client } from "@/orpc/client";

export const Route = createFileRoute("/")({ component: App });

function App() {
	const { queryClient } = getApplicationContext();

	const { data } = useQuery({
		queryKey: ["nodes", "all"],
		queryFn: () => client.nodeRouter.list(),
	});

	const dataTree = useMemo(() => buildChildrenMap(data ?? []), [data]);

	const toggleExpandedMutation = useMutation({
		mutationFn: ({ id, expanded }: { id: string; expanded: boolean }) =>
			client.nodeActionsRouter.toggleExpanded({ id, expanded }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["nodes", "all"] });
		},
	});

	const onToggleExpanded = (node: Node) => {
		const currentExpanded = node.metadata?.expanded ?? false;

		toggleExpandedMutation.mutate({ id: node.id, expanded: !currentExpanded });
	};

	return (
		<div className="py-16">
			<div className="max-w-7xl mx-auto">
				{renderTree(dataTree, null, 0, {
					onToggleExpanded,
				})}
				<CreateNewNode />
			</div>
		</div>
	);
}
