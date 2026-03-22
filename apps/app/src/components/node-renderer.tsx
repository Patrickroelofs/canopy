import { CaretRightIcon } from "@phosphor-icons/react";
import { useDeleteNodeAction } from "@/actions/delete-node-action";
import { useExpandNodeAction } from "@/actions/expand-node-actions";
import { useMoveNodeActions } from "@/actions/move-node-action";
import type { Node } from "@/db/schemas/node-schema";
import { getApplicationContext } from "@/lib/root-provider";
import { cn } from "@/lib/utils";
import { NodeSwitch } from "./node-switch";
import { Button } from "./ui/button";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuGroup,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuSub,
	ContextMenuSubContent,
	ContextMenuSubTrigger,
	ContextMenuTrigger,
} from "./ui/context-menu";

interface NodeRendererProps {
	tree: Map<string, Node[]>;
	childNodes: Node[];
	node: Node;
}

export const NodeRenderer = ({ node, tree, childNodes }: NodeRendererProps) => {
	const { queryClient } = getApplicationContext();

	const invalidateNodes = () => {
		queryClient.invalidateQueries({ queryKey: ["nodes", "all"] });
	};

	const { mutate: toggleExpandedMutation } = useExpandNodeAction();
	const { mutate: deleteNodeMutation } = useDeleteNodeAction({
		invalidateNodes,
	});

	const {
		moveUpMutation,
		moveDownMutation,
		indentNodeMutation,
		outdentNodeMutation,
	} = useMoveNodeActions({
		tree,
		invalidateNodes,
	});

	const onToggleExpanded = (node: Node) => {
		const currentExpanded = node.metadata?.expanded ?? false;

		toggleExpandedMutation({ id: node.id, expanded: !currentExpanded });
	};

	return (
		<ContextMenu>
			<ContextMenuTrigger
				className={cn(
					"flex gap-2 w-full items-center",
					childNodes.length === 0 && "pl-8",
				)}
			>
				{childNodes.length > 0 && (
					<Button
						onClick={() => onToggleExpanded(node)}
						type="button"
						variant="outline"
						className={`
									shrink-0 w-6 h-6 flex
										${node.metadata?.expanded ? "rotate-90" : ""}
								`}
						tabIndex={-1}
					>
						<CaretRightIcon className="w-3 h-3 text-muted-foreground transition-transform" />
					</Button>
				)}

				<div className="flex-1 w-full">
					<NodeSwitch node={node} />
				</div>
			</ContextMenuTrigger>
			<ContextMenuContent align="end" className="w-48">
				<ContextMenuSub>
					<ContextMenuSubTrigger>Convert Node into</ContextMenuSubTrigger>
					<ContextMenuSubContent className="w-48">
						<ContextMenuItem>Paragraph</ContextMenuItem>
						<ContextMenuItem>Task</ContextMenuItem>
					</ContextMenuSubContent>
				</ContextMenuSub>
				<ContextMenuSeparator />
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
						onClick={() => deleteNodeMutation(node.id)}
					>
						Delete
					</ContextMenuItem>
				</ContextMenuGroup>
			</ContextMenuContent>
		</ContextMenu>
	);
};
