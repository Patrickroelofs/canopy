import { memo } from "react";
import { useDeleteNodeAction } from "@/actions/delete-node-action";
import type { Node } from "@/db/schemas/node-schema";
import { getApplicationContext } from "@/lib/root-provider";
import { cn } from "@/lib/utils";
import { NodeSwitch } from "./node-switch";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuGroup,
	ContextMenuItem,
	ContextMenuTrigger,
} from "./ui/context-menu";

interface NodeRendererProps {
	node: Node;
}

export const NodeRenderer = memo(function NodeRenderer({
	node,
}: NodeRendererProps) {
	const { queryClient } = getApplicationContext();

	const invalidateNodes = () => {
		queryClient.invalidateQueries({ queryKey: ["nodes", "all"] });
	};

	const { mutate: deleteNodeMutation } = useDeleteNodeAction({
		invalidateNodes,
	});

	return (
		<ContextMenu>
			<ContextMenuTrigger className={cn("flex gap-2 w-full items-center")}>
				<div className="flex-1 w-full">
					<NodeSwitch node={node} />
				</div>
			</ContextMenuTrigger>
			<ContextMenuContent align="end" className="w-48">
				<ContextMenuGroup>
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
});
