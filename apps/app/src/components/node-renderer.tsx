import { useDeleteNodeAction } from "@/actions/delete-node-action";
import { useMoveNodeActions } from "@/actions/move-node-action";
import type { Node } from "@/db/schemas/node-schema";
import { getApplicationContext } from "@/lib/root-provider";
import { NodeSwitch } from "./node-switch";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuGroup,
	ContextMenuItem,
	ContextMenuTrigger,
} from "./ui/context-menu";

interface NodeRendererProps {
	tree: Map<string, Node[]>;
	node: Node;
}

export const NodeRenderer = ({ node, tree }: NodeRendererProps) => {
	const { queryClient } = getApplicationContext();

	const invalidateNodes = () => {
		queryClient.invalidateQueries({ queryKey: ["nodes", "all"] });
	};

	const deleteNodeMutation = useDeleteNodeAction({ invalidateNodes });
	const {
		moveUpMutation,
		moveDownMutation,
		indentNodeMutation,
		outdentNodeMutation,
	} = useMoveNodeActions({
		tree,
		invalidateNodes,
	});

	return (
		<div className="group relative flex items-start gap-2 w-full">
			<ContextMenu>
				<ContextMenuTrigger
					render={
						<div className="flex-1 w-full">
							<NodeSwitch node={node} />
						</div>
					}
				></ContextMenuTrigger>
				<ContextMenuContent align="end" className="w-48">
					<ContextMenuGroup>
						<ContextMenuItem onClick={() => moveUpMutation.mutate(node)}>
							Move up
						</ContextMenuItem>
						<ContextMenuItem onClick={() => moveDownMutation.mutate(node)}>
							Move down
						</ContextMenuItem>
						<ContextMenuItem onClick={() => indentNodeMutation.mutate(node)}>
							Indent
						</ContextMenuItem>
						<ContextMenuItem onClick={() => outdentNodeMutation.mutate(node)}>
							Outdent
						</ContextMenuItem>
						<ContextMenuItem
							variant="destructive"
							onClick={() => deleteNodeMutation.mutate(node.id)}
						>
							Delete
						</ContextMenuItem>
					</ContextMenuGroup>
				</ContextMenuContent>
			</ContextMenu>
		</div>
	);
};
