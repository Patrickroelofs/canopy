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
			<div key={node.id}>
				<NodeRenderer node={node} />

				<div
					style={{
						paddingLeft: children.length > 0 ? 20 : 0,
					}}
				>
					{children.length > 0 ? renderTree(tree, node.id, depth + 1) : null}
				</div>
			</div>
		);
	});
};
