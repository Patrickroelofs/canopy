import type { Node } from "@/db/schemas/node-schema";
import { TypographyNode } from "./nodes/typography-node";

interface NodeRendererProps {
	node: Node;
}

export const NodeSwitch = ({ node }: NodeRendererProps) => {
	switch (node.type) {
		case "paragraph":
			return <TypographyNode node={node} />;
		default:
			return (
				<div className="text-muted-foreground italic">Unsupported node</div>
			);
	}
};
