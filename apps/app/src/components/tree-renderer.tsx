import { NodeRenderer } from "@/components/node-renderer";
import type { Node } from "@/db/schemas/node-schema";
import { parentKey } from "@/lib/build-tree-map";

export const renderTree = (
	tree: Map<string, Node[]>,
	parentId: string | null,
	depth: number,
) => {
	const siblings = tree.get(parentKey(parentId)) ?? [];

	return siblings.map((node) => {
		const children = tree.get(node.id) ?? [];

		return (
			<div key={node.id} className="relative">
				<div className="flex items-center">
					<NodeRenderer node={node} childNodes={children} />
				</div>

				{node.metadata?.expanded && (
					<div className="ml-2.75 pl-4 border-l border-border">
						{children.length > 0 ? renderTree(tree, node.id, depth + 1) : null}
					</div>
				)}
			</div>
		);
	});
};
