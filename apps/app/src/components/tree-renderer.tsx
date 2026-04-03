import { NodeRenderer } from "@/components/node-renderer";
import type { Node } from "@/db/schemas/node-schema";

export const renderTree = (tree: Node[] | undefined) => {
	if (!tree) return null;

	return tree.map((node) => {
		return (
			<div key={node.id} className="relative">
				<div className="flex items-center">
					<NodeRenderer node={node} />
				</div>
			</div>
		);
	});
};
