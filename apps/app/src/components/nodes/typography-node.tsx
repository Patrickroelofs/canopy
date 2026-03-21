import type { Node } from "@/db/schemas/node-schema";

interface TypographyNodeProps {
	node: Node;
}

export const TypographyNode = ({ node }: TypographyNodeProps) => {
	return (
		<div className="group flex items-start gap-2 px-1 py-1 hover:bg-muted/40 rounded-lg">
			<span
				aria-hidden
				className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/50 transition-colors group-hover:bg-foreground/60"
			/>
			<p className="min-w-0 flex-1 leading-6 text-foreground wrap-break-word">
				{node.content}
			</p>
		</div>
	);
};
