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
					className={
						children.length > 0
							? "ml-2 pl-4 border-l border-border *:relative *:before:content-[''] *:before:absolute *:before:-left-4 *:before:top-[0.9em] *:before:w-4 *:before:border-t *:before:border-border"
							: ""
					}
				>
					{children.length > 0 ? renderTree(tree, node.id, depth + 1) : null}
				</div>
			</div>
		);
	});
};
