import { memo } from "react";
import type { Node } from "@/db/schemas/node-schema";
import { TaskNode } from "./nodes/task-node";
import { TypographyNode } from "./nodes/typography-node";

interface NodeRendererProps {
	node: Node;
}

export const NodeSwitch = memo(function NodeSwitch({ node }: NodeRendererProps) {
	switch (node.type) {
		case "paragraph":
			return <TypographyNode node={node} />;
		case "task":
			return <TaskNode node={node} />;
		default:
			return (
				<div className="text-muted-foreground italic">Unsupported node</div>
			);
	}
});
