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
	tree: Map<string, Node[]>;
	node: Node;
}

export const NodeRenderer = ({ node, tree }: NodeRendererProps) => {
	const { queryClient } = getApplicationContext();

	const deleteNodeMutation = useMutation({
		mutationFn: (id: string) => client.nodeRouter.delete({ id }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["nodes", "all"] });
		},
	});

	const indentNodeMutation = useMutation({
		mutationFn: async (node: Node) => {
			const siblings = tree.get(node.parentId ?? "__root__") || [];

			const idx = siblings.findIndex((n) => n.id === node.id);

			if (idx > 0) {
				const prevSibling = siblings[idx - 1];
				return client.nodeActionsRouter.indentNode({
					id: node.id,
					parentId: prevSibling.id,
				});
			}

			return null;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["nodes", "all"] });
		},
	});

	const outdentNodeMutation = useMutation({
		mutationFn: async (node: Node) => {
			if (!node.parentId) return null;
			let parent: Node | undefined;

			for (const siblings of tree.values()) {
				parent = siblings.find((n) => n.id === node.parentId);
				if (parent) break;
			}

			if (parent) {
				return client.nodeActionsRouter.outdentNode({
					id: node.id,
					parentId: parent.parentId ?? null,
				});
			}

			return null;
		},
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
