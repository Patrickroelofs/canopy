import { useSortable } from "@dnd-kit/sortable";
import { DotsSixVerticalIcon } from "@phosphor-icons/react";
import { type CSSProperties, memo } from "react";
import { NodeRenderer } from "@/components/node-renderer";
import type { Node } from "@/db/schemas/node-schema";
import { INDENT_WIDTH } from "@/lib/dnd-projection";
import type { FlattenedNode } from "@/lib/flatten-tree";
import { cn } from "@/lib/utils";

interface SortableNodeRowProps {
	flatItem: FlattenedNode;
	childNodes: Node[];
	isDropTarget: boolean;
	isNestTarget: boolean;
	isForbidden: boolean;
	projectedDepth: number | null;
	isActiveItem: boolean;
}

export const SortableNodeRow = memo(function SortableNodeRow({
	flatItem,
	childNodes,
	isDropTarget,
	isNestTarget,
	isForbidden,
	projectedDepth,
	isActiveItem,
}: SortableNodeRowProps) {
	const { node, depth } = flatItem;

	const isNesting = projectedDepth !== null && projectedDepth > depth;

	const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging } =
		useSortable({
			id: node.id,
		});

	const style: CSSProperties = {
		paddingLeft: `${depth * INDENT_WIDTH}px`,
		opacity: isDragging ? 0.15 : 1,
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={cn(
				"relative contain-layout contain-style",
				isForbidden && "bg-destructive/10 rounded-md",
				isNestTarget && "bg-primary/5 rounded-md ring-2 ring-primary/30",
			)}
			{...attributes}
		>
			{isDropTarget &&
				!isForbidden &&
				(!isActiveItem ||
					(projectedDepth !== null && projectedDepth !== depth)) && (
					<div
						className={cn(
							"absolute left-0 right-0 flex items-center z-10 pointer-events-none",
							isNesting ? "bottom-0" : "top-0",
						)}
						style={{
							marginLeft: `${(projectedDepth ?? depth) * INDENT_WIDTH}px`,
						}}
					>
						<div className="w-2 h-2 rounded-full bg-primary shrink-0 -ml-1" />
						<div className="h-0.5 bg-primary flex-1 rounded-full" />
					</div>
				)}

			<div className="relative z-1 flex items-center gap-0.5 group">
				<button
					ref={setActivatorNodeRef}
					type="button"
					className={cn(
						childNodes ? "-left-6" : "left-0",
						"absolute",
						"shrink-0 w-5 h-5 flex items-center justify-center",
						"cursor-grab active:cursor-grabbing",
						"opacity-0 group-hover:opacity-100 transition-opacity",
						"text-muted-foreground hover:text-foreground",
						"rounded focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
					)}
					{...listeners}
					tabIndex={-1}
				>
					<DotsSixVerticalIcon className="w-3.5 h-3.5" />
				</button>

				<div className="flex-1 flex items-center min-w-0">
					<NodeRenderer node={node} childNodes={childNodes} />
				</div>
			</div>
		</div>
	);
});
