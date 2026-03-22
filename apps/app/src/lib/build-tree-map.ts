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

	for (const siblings of map.values()) {
		siblings.sort((a, b) => {
			const aOrder = a.order;
			const bOrder = b.order;

			if (aOrder && bOrder && aOrder !== bOrder) {
				if (aOrder < bOrder) return -1;
				if (aOrder > bOrder) return 1;
				return 0;
			}

			if (aOrder === bOrder) {
				const aCreatedAt = a.createdAt?.getTime() ?? 0;
				const bCreatedAt = b.createdAt?.getTime() ?? 0;
				return aCreatedAt - bCreatedAt;
			}

			if (aOrder) return -1;
			if (bOrder) return 1;
			return 0;
		});
	}

	return map;
}
