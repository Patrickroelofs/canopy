import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useListNodesAction } from "@/actions/list-nodes-action";
import { CreateNewNode } from "@/components/nodes/create-new-node";
import { TreeContainer } from "@/components/tree-container";
import { TreeSkeleton } from "@/components/tree-skeleton";
import { buildChildrenMap } from "@/lib/build-tree-map";

export const Route = createFileRoute("/")({ component: App });

function App() {
	const { data, isLoading } = useListNodesAction();

	const dataTree = useMemo(() => buildChildrenMap(data ?? []), [data]);

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
				<TreeContainer tree={dataTree} />
				<CreateNewNode />
			</div>
		</div>
	);
}
