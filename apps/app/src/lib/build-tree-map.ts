import type { Node } from "@/db/schemas/node-schema";
import { compareNodesByPosition } from "@/lib/position";

export function parentKey(parentId: string | null) {
	return parentId ?? "__root__";
}

export function buildChildrenMap(nodes: Node[]) {
	const map = new Map<string, Node[]>();

	for (const node of nodes) {
		const key = parentKey(node.parentId ?? null);
		const existing = map.get(key);

		if (existing) {
			existing.push(node);
		} else {
			map.set(key, [node]);
		}
	}

	for (const [key, siblings] of map) {
		map.set(key, [...siblings].sort(compareNodesByPosition));
	}

	return map;
}
