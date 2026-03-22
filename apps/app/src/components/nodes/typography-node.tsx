import type { Node } from "@/db/schemas/node-schema";
import { EditableRegion } from "../editable-region";

interface TypographyNodeProps {
	node: Node;
}

export const TypographyNode = ({ node }: TypographyNodeProps) => {
	return (
		<div className="group flex items-start gap-3 px-1 py-1 w-full">
			<span
				aria-hidden
				className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/50 transition-colors group-hover:bg-foreground/60"
			/>

			<EditableRegion node={node} />
		</div>
	);
};
