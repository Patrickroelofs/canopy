import type { Node } from "@/db/schemas/node-schema";

interface TypographyNodeProps {
	node: Node;
}

export const TypographyNode = ({ node }: TypographyNodeProps) => {
	return <p>{node.content}</p>;
};
