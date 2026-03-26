import type { Node } from "@/db/schemas/node-schema";
import { parentKey } from "@/lib/build-tree-map";

export interface FlattenedNode {
	node: Node;
	depth: number;
	parentId: string | null;
	index: number;
	childCount: number;
}

/**
 * Walk the children map in display order and produce a flat array.
 * Only includes children of expanded nodes.
 */
export function flattenTree(
	map: Map<string, Node[]>,
	rootParentId: string | null = null,
	depth = 0,
): FlattenedNode[] {
	const result: FlattenedNode[] = [];
	const siblings = map.get(parentKey(rootParentId)) ?? [];

	for (let i = 0; i < siblings.length; i++) {
		const node = siblings[i];
		const children = map.get(node.id) ?? [];

		result.push({
			node,
			depth,
			parentId: node.parentId ?? null,
			index: i,
			childCount: children.length,
		});

		if (node.metadata?.expanded && children.length > 0) {
			result.push(...flattenTree(map, node.id, depth + 1));
		}
	}

	return result;
}

/**
 * Collect all transitive descendant IDs of a given node.
 * Used to prevent circular drops (dropping a node into its own subtree).
 */
export function getDescendantIds(
	map: Map<string, Node[]>,
	nodeId: string,
): Set<string> {
	const descendants = new Set<string>();
	const stack = [nodeId];

	while (stack.length > 0) {
		const current = stack.pop();
		if (!current) continue;
		const children = map.get(current) ?? [];

		for (const child of children) {
			descendants.add(child.id);
			stack.push(child.id);
		}
	}

	return descendants;
}


