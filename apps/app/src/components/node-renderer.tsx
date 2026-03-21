import { DotsThreeIcon } from "@phosphor-icons/react";
import { useMutation } from "@tanstack/react-query";
import { TypographyNode } from "@/components/nodes/typography-node";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Node } from "@/db/schemas/node-schema";
import { getApplicationContext } from "@/lib/root-provider";
import { client } from "@/orpc/client";
import { NodeSwitch } from "./node-switch";

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

	const renderMenu = () => (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button variant="ghost" size="sm" className="h-8 w-8 p-0">
						<DotsThreeIcon className="h-4 w-4" />
					</Button>
				}
			></DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-48">
				<DropdownMenuGroup>
					<DropdownMenuLabel>Node Settings</DropdownMenuLabel>
					<DropdownMenuSeparator />
					<DropdownMenuItem
						variant="destructive"
						onClick={() => deleteNodeMutation.mutate(node.id)}
					>
						Delete
					</DropdownMenuItem>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);

	return (
		<div className="group relative flex items-start gap-2">
			<div className="absolute -left-8 opacity-0 group-hover:opacity-100 transition-opacity">
				{renderMenu()}
			</div>

			<div className="flex-1">
				<NodeSwitch node={node} />
			</div>
		</div>
	);
};
