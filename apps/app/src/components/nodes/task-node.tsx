import { useToggleTaskNodeAction } from "@/actions/toggle-task-node-action";
import type { Node } from "@/db/schemas/node-schema";
import { getApplicationContext } from "@/lib/root-provider";
import { cn } from "@/lib/utils.ts";
import { EditableRegion } from "../editable-region";
import { Checkbox } from "../ui/checkbox";

interface TaskNodeProps {
	node: Node;
}

export const TaskNode = ({ node }: TaskNodeProps) => {
	const { queryClient } = getApplicationContext();
	const isCompleted = node.metadata?.taskCompleted ?? false;

	const { mutate } = useToggleTaskNodeAction({
		invalidateNodes: () => {
			queryClient.invalidateQueries({ queryKey: ["nodes", "all"] });
		},
	});

	return (
		<div className="group flex items-center gap-2 py-1 w-full">
			<Checkbox
				checked={isCompleted}
				onClick={() => mutate({ nodeId: node.id })}
				className="mr-2"
			/>
			<div
				className={cn(
					"w-full",
					isCompleted ? "line-through text-muted-foreground" : "",
				)}
			>
				<EditableRegion node={node} />
			</div>
		</div>
	);
};
