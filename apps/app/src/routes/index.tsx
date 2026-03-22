import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useExpandNodeAction } from "@/actions/expand-node-actions";
import { useListNodesAction } from "@/actions/list-nodes-action";
import { CreateNewNode } from "@/components/nodes/create-new-node";
import { renderTree } from "@/components/tree-renderer";
import { TreeSkeleton } from "@/components/tree-skeleton";
import type { Node } from "@/db/schemas/node-schema";
import { buildChildrenMap } from "@/lib/build-tree-map";

export const Route = createFileRoute("/")({ component: App });

function App() {
	const { data, isLoading } = useListNodesAction();

	const dataTree = useMemo(() => buildChildrenMap(data ?? []), [data]);

	const { mutate: toggleExpandedMutation } = useExpandNodeAction();

	const onToggleExpanded = (node: Node) => {
		const currentExpanded = node.metadata?.expanded ?? false;

		toggleExpandedMutation({ id: node.id, expanded: !currentExpanded });
	};

	if (isLoading) {
		return (
			<div className="py-16">
				<div className="max-w-7xl mx-auto">
					<TreeSkeleton />
				</div>
			</div>
		);
	}

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
