import type { Node } from "@/db/schemas/node-schema";
import { EditableRegion } from "../editable-region";

interface TypographyNodeProps {
	node: Node;
}

export const TypographyNode = ({ node }: TypographyNodeProps) => {
	return (
		<div className="group flex items-start gap-3 px-1 py-1 w-full">
			<EditableRegion node={node} />
		</div>
	);
};
