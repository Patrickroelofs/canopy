import { TypographyNode } from "@/components/nodes/typography-node";
import type { Node } from "@/db/schemas/node-schema";
import { TaskNode } from "./nodes/task-node";

interface NodeRendererProps {
	node: Node;
}

export const NodeRenderer = ({ node }: NodeRendererProps) => {
	switch (node.type) {
		case "paragraph":
			return <TypographyNode node={node} />;
		case "task":
			return <TaskNode node={node} />;
		default:
			throw new Error(`Unknown node type: ${node.type}`);
	}
};
