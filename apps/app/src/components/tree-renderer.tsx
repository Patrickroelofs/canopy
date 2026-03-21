import { CaretRightIcon } from "@phosphor-icons/react";
import { NodeRenderer } from "@/components/node-renderer";
import type { Node } from "@/db/schemas/node-schema";
import { parentKey } from "@/lib/build-tree-map";

export const renderTree = (
	tree: Map<string, Node[]>,
	parentId: string | null,
	depth: number,
	handlers: {
		onToggleExpanded: (node: Node) => void;
	},
) => {
	const siblings = tree.get(parentKey(parentId)) ?? [];

	return siblings.map((node) => {
		const children = tree.get(node.id) ?? [];

		return (
			<div key={node.id}>
				<div className="flex items-center">
					{children.length > 0 && (
						<button
							onClick={() => handlers.onToggleExpanded(node)}
							type="button"
							className={`
								shrink-0 w-4 h-4 flex items-center justify-center rounded hover:bg-accent transition-colors
									${node.metadata?.expanded ? "rotate-90" : ""}
							`}
							tabIndex={-1}
						>
							<CaretRightIcon
								className={`w-3 h-3 text-muted-foreground transition-transform`}
							/>
						</button>
					)}

					<NodeRenderer node={node} tree={tree} />
				</div>

				{node.metadata?.expanded && (
					<div
						className={
							children.length > 0
								? "ml-2 pl-4 border-l border-border *:relative *:before:content-[''] *:before:absolute *:before:-left-4 *:before:top-[0.9em] *:before:w-4 *:before:border-t *:before:border-border"
								: ""
						}
					>
						{children.length > 0
							? renderTree(tree, node.id, depth + 1, handlers)
							: null}
					</div>
				)}
			</div>
		);
	});
};
