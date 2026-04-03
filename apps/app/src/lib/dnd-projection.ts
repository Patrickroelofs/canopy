import { generateKeyBetween } from "fractional-indexing";
import type { Node } from "@/db/schemas/node-schema";
import { parentKey } from "@/lib/build-tree-map";
import type { FlattenedNode } from "@/lib/flatten-tree";
import { getDescendantIds } from "@/lib/flatten-tree";

export const INDENT_WIDTH = 44; // px per depth level

export interface Projection {
	parentId: string | null;
	order: string;
	depth: number;
}

/**
 * Given the flattened tree, active/over item IDs, and horizontal drag delta,
 * compute where the dragged node should land (parentId + order + depth).
 *
 * Returns `null` if the drop would be invalid (e.g. circular).
 */
export function getProjection(
	flattenedItems: FlattenedNode[],
	tree: Map<string, Node[]>,
	activeId: string,
	overId: string,
	dragDeltaX: number,
	indexMap?: Map<string, number>,
): Projection | null {
	const activeIndex = indexMap?.get(activeId) ?? flattenedItems.findIndex((i) => i.node.id === activeId);
	const overIndex = indexMap?.get(overId) ?? flattenedItems.findIndex((i) => i.node.id === overId);

	if (activeIndex === -1 || overIndex === -1) return null;

	const activeItem = flattenedItems[activeIndex];

	const activeDescendants = getDescendantIds(tree, activeId);

	const depthOffset = Math.round(dragDeltaX / INDENT_WIDTH);
	const projectedDepth = activeItem.depth + depthOffset;

	const { minDepth, maxDepth } = getDepthBounds(
		flattenedItems,
		activeId,
		activeDescendants,
		overIndex,
	);
	const clampedDepth = Math.max(minDepth, Math.min(maxDepth, projectedDepth));

	const newParentId = getParentIdForDepth(
		flattenedItems,
		overIndex,
		clampedDepth,
		activeId,
	);

	if (newParentId === activeId) return null;
	if (newParentId !== null && activeDescendants.has(newParentId)) return null;

	const order = computeOrder(
		flattenedItems,
		tree,
		activeIndex,
		overIndex,
		clampedDepth,
		newParentId,
		activeId,
	);

	return { parentId: newParentId, order, depth: clampedDepth };
}

function getDepthBounds(
	items: FlattenedNode[],
	activeId: string,
	activeDescendants: Set<string>,
	overIndex: number,
): { minDepth: number; maxDepth: number } {
	const nextItem = items
		.slice(overIndex + 1)
		.find((i) => i.node.id !== activeId && !activeDescendants.has(i.node.id));

	const overItem = items[overIndex];

	const maxDepth =
		overItem.node.id !== activeId ? overItem.depth + 1 : overItem.depth;

	const minDepth = nextItem ? nextItem.depth : 0;

	return { minDepth, maxDepth };
}

function getParentIdForDepth(
	items: FlattenedNode[],
	overIndex: number,
	targetDepth: number,
	activeId: string,
): string | null {
	if (targetDepth === 0) return null;

	for (let i = overIndex; i >= 0; i--) {
		const item = items[i];
		if (item.node.id === activeId) continue;
		if (item.depth === targetDepth - 1) {
			return item.node.id;
		}
		if (item.depth < targetDepth - 1) break;
	}

	return null;
}

function computeOrder(
	flattenedItems: FlattenedNode[],
	tree: Map<string, Node[]>,
	activeIndex: number,
	overIndex: number,
	depth: number,
	newParentId: string | null,
	activeId: string,
): string {
	const siblings = tree.get(parentKey(newParentId)) ?? [];
	const filteredSiblings = [...siblings]
		.filter((s) => s.id !== activeId)
		.sort((a, b) => (a.order < b.order ? -1 : a.order > b.order ? 1 : 0));

	const overItem = flattenedItems[overIndex];

	if (depth > overItem.depth) {
		const lastChild = filteredSiblings.at(-1);
		return generateKeyBetween(lastChild?.order ?? null, null);
	}

	if (overItem.parentId === newParentId && overItem.node.id !== activeId) {
		const overSiblingIndex = filteredSiblings.findIndex(
			(s) => s.id === overItem.node.id,
		);

		if (overSiblingIndex !== -1) {
			if (activeIndex > overIndex) {
				const prevSibling =
					overSiblingIndex > 0
						? filteredSiblings[overSiblingIndex - 1]
						: undefined;
				const prevOrder = prevSibling?.order ?? null;
				const overOrder = filteredSiblings[overSiblingIndex]?.order ?? null;
				return generateKeyBetween(prevOrder, overOrder);
			}

			const overOrder = filteredSiblings[overSiblingIndex]?.order ?? null;
			const nextSibling = filteredSiblings[overSiblingIndex + 1];
			const nextOrder = nextSibling?.order ?? null;
			return generateKeyBetween(overOrder, nextOrder);
		}
	}

	if (overItem.node.id === activeId && newParentId !== overItem.parentId) {
		for (let i = overIndex - 1; i >= 0; i--) {
			const item = flattenedItems[i];
			if (item.node.id === activeId) continue;
			if (item.parentId === newParentId) {
				const sibIdx = filteredSiblings.findIndex((s) => s.id === item.node.id);
				if (sibIdx !== -1) {
					const afterOrder = filteredSiblings[sibIdx]?.order ?? null;
					const nextSibling = filteredSiblings[sibIdx + 1];
					const nextOrder = nextSibling?.order ?? null;
					return generateKeyBetween(afterOrder, nextOrder);
				}
				break;
			}
			if (item.depth < depth) break;
		}
	}

	const lastChild = filteredSiblings.at(-1);
	return generateKeyBetween(lastChild?.order ?? null, null);
}
