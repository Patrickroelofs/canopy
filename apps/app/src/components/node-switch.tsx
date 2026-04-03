import type { Node } from "@/db/schemas/node-schema";
import { TypographyNode } from "./nodes/typography-node";

interface NodeRendererProps {
	node: Node;
}

export const NodeSwitch = ({ node }: NodeRendererProps) => {
	switch (true) {
		default:
			return <TypographyNode node={node} />;
	}
};
