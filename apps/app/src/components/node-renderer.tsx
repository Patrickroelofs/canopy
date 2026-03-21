import { useMutation } from "@tanstack/react-query";
import type { Node } from "@/db/schemas/node-schema";
import { getApplicationContext } from "@/lib/root-provider";
import { client } from "@/orpc/client";
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

export const NodeRenderer = ({ node }: NodeRendererProps) => {
	const { queryClient } = getApplicationContext();

	const deleteNodeMutation = useMutation({
		mutationFn: (id: string) => client.nodeRouter.delete({ id }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["nodes", "all"] });
		},
	});

	return (
		<div className="group relative flex items-start gap-2">
			<ContextMenu>
				<ContextMenuTrigger
					render={
						<div className="flex-1">
							<NodeSwitch node={node} />
						</div>
					}
				></ContextMenuTrigger>
				<ContextMenuContent align="end" className="w-48">
					<ContextMenuGroup>
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
