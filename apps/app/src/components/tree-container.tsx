import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	type DragMoveEvent,
	DragOverlay,
	type DragStartEvent,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	SortableContext,
	sortableKeyboardCoordinates,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useCallback, useMemo, useRef, useState } from "react";
import { useDragMoveNodeAction } from "@/actions/drag-move-node-action";
import { useExpandNodeAction } from "@/actions/expand-node-actions";
import { SortableNodeRow } from "@/components/sortable-node-row";
import type { Node } from "@/db/schemas/node-schema";
import type { Projection } from "@/lib/dnd-projection";
import { getProjection } from "@/lib/dnd-projection";
import { flattenTree } from "@/lib/flatten-tree";

interface TreeContainerProps {
	tree: Map<string, Node[]>;
}

const emptyArray: Node[] = [];

export const TreeContainer = ({ tree }: TreeContainerProps) => {
	const [activeId, setActiveId] = useState<string | null>(null);
	const [overId, setOverId] = useState<string | null>(null);
	const [dragDeltaX, setDragDeltaX] = useState(0);

	const { mutate: dragMoveNode } = useDragMoveNodeAction();
	const { mutate: toggleExpanded } = useExpandNodeAction();

	const flattenedItems = useMemo(() => flattenTree(tree), [tree]);
	const sortableIds = useMemo(
		() => flattenedItems.map((item) => item.node.id),
		[flattenedItems],
	);

	const indexMap = useMemo(() => {
		const map = new Map<string, number>();
		for (let i = 0; i < flattenedItems.length; i++) {
			map.set(flattenedItems[i].node.id, i);
		}
		return map;
	}, [flattenedItems]);

	const projection = useMemo<Projection | null>(() => {
		if (!activeId || !overId) return null;
		return getProjection(flattenedItems, tree, activeId, overId, dragDeltaX, indexMap);
	}, [flattenedItems, tree, activeId, overId, dragDeltaX, indexMap]);

	const rafRef = useRef<number | null>(null);

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 5,
			},
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	const resetDragState = useCallback(() => {
		if (rafRef.current !== null) {
			cancelAnimationFrame(rafRef.current);
			rafRef.current = null;
		}
		setActiveId(null);
		setOverId(null);
		setDragDeltaX(0);
	}, []);

	const autoExpandParent = useCallback(
		(parentId: string) => {
			const idx = indexMap.get(parentId);
			const parentItem = idx !== undefined ? flattenedItems[idx] : undefined;
			if (parentItem && !parentItem.node.metadata?.expanded) {
				toggleExpanded({ id: parentId, expanded: true });
			}
		},
		[flattenedItems, indexMap, toggleExpanded],
	);

	const handleDragStart = useCallback((event: DragStartEvent) => {
		const { active } = event;
		setActiveId(active.id as string);
		setDragDeltaX(0);
	}, []);

	const handleDragMove = useCallback((event: DragMoveEvent) => {
		const { over, delta } = event;
		if (rafRef.current !== null) {
			cancelAnimationFrame(rafRef.current);
		}
		rafRef.current = requestAnimationFrame(() => {
			rafRef.current = null;
			setOverId(over?.id as string | null);
			setDragDeltaX(delta.x);
		});
	}, []);

	const handleDragEnd = useCallback(
		(event: DragEndEvent) => {
			const { active, over, delta } = event;

			if (!over) {
				resetDragState();
				return;
			}

			const finalProjection = getProjection(
				flattenedItems,
				tree,
				active.id as string,
				over.id as string,
				delta.x,
				indexMap,
			);

			if (finalProjection) {
				const activeIdx = indexMap.get(active.id as string);
				const activeItem = activeIdx !== undefined ? flattenedItems[activeIdx] : undefined;

				const hasChanged =
					!activeItem ||
					activeItem.parentId !== finalProjection.parentId ||
					activeItem.depth !== finalProjection.depth ||
					active.id !== over.id;

				if (hasChanged) {
					if (finalProjection.parentId) {
						autoExpandParent(finalProjection.parentId);
					}

					dragMoveNode({
						id: active.id as string,
						parentId: finalProjection.parentId,
						order: finalProjection.order,
					});
				}
			}

			resetDragState();
		},
		[flattenedItems, tree, indexMap, dragMoveNode, autoExpandParent, resetDragState],
	);

	const handleDragCancel = useCallback(() => {
		resetDragState();
	}, [resetDragState]);

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={closestCenter}
			onDragStart={handleDragStart}
			onDragMove={handleDragMove}
			onDragEnd={handleDragEnd}
			onDragCancel={handleDragCancel}
		>
			<SortableContext
				items={sortableIds}
				strategy={verticalListSortingStrategy}
			>
				{flattenedItems.map((flatItem) => {
					const isOverThis = overId === flatItem.node.id;
					const isDropTarget = isOverThis && activeId !== null;
					const isForbidden = isDropTarget && projection === null;

					const isNestTarget =
						activeId !== null &&
						!isOverThis &&
						projection !== null &&
						projection.parentId === flatItem.node.id &&
						projection.depth > flatItem.depth;

					const childNodes = tree.get(flatItem.node.id) ?? emptyArray;

					return (
						<SortableNodeRow
							key={flatItem.node.id}
							flatItem={flatItem}
							childNodes={childNodes}
							isDropTarget={isDropTarget}
							isNestTarget={isNestTarget}
							isForbidden={isForbidden}
							projectedDepth={projection?.depth ?? null}
							isActiveItem={flatItem.node.id === activeId}
						/>
					);
				})}
			</SortableContext>

			<DragOverlay dropAnimation={null} />
		</DndContext>
	);
};
