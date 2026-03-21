import type { Node } from "@/db/schemas/node-schema";

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

	return map;
}
