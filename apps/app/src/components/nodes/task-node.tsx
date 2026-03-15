import type { Node } from "@/db/schemas/node-schema";
import { Checkbox } from "../ui/checkbox";

interface TaskNodeProps {
	node: Node;
}

export const TaskNode = ({ node }: TaskNodeProps) => {
	return (
		<p className="flex gap-2 items-center">
			<Checkbox checked={node.metadata?.taskCompleted || false} />
			{node.content}
		</p>
	);
};
