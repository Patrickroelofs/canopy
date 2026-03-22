import { useMutation } from "@tanstack/react-query";
import { generateKeyBetween } from "fractional-indexing";
import type { Node } from "@/db/schemas/node-schema";
import { client } from "@/orpc/client";

interface UseMoveNodeActionsParams {
	tree: Map<string, Node[]>;
	invalidateNodes: () => void;
}

const getSiblingOrder = (target: Node) => target.order;

const sortedSiblings = (tree: Map<string, Node[]>, target: Node) => {
	const siblings = tree.get(target.parentId ?? "__root__") || [];
	return [...siblings].sort((a, b) => {
		const aKey = getSiblingOrder(a);
		const bKey = getSiblingOrder(b);

		if (aKey && bKey && aKey !== bKey) {
			if (aKey < bKey) return -1;
			if (aKey > bKey) return 1;
			return 0;
		}

		if (aKey) return -1;
		if (bKey) return 1;
		return 0;
	});
};

export const useMoveNodeActions = ({
	tree,
	invalidateNodes,
}: UseMoveNodeActionsParams) => {
	const moveNodeMutation = useMutation({
		mutationFn: ({ id, order }: { id: string; order: string }) =>
			client.nodeActionsRouter.moveNode({ id, order }),
		onSuccess: invalidateNodes,
	});

	const moveUpMutation = useMutation({
		mutationFn: async (target: Node) => {
			const siblings = sortedSiblings(tree, target);
			const idx = siblings.findIndex((n) => n.id === target.id);

			if (idx <= 0) return null;

			const prev = siblings[idx - 1];
			const prevPrev = idx > 1 ? siblings[idx - 2] : undefined;
			const prevOrder = getSiblingOrder(prev) ?? null;
			const prevPrevOrder = prevPrev
				? (getSiblingOrder(prevPrev) ?? null)
				: null;

			return moveNodeMutation.mutateAsync({
				id: target.id,
				order: generateKeyBetween(prevPrevOrder, prevOrder),
			});
		},
		onSuccess: invalidateNodes,
	});

	const moveDownMutation = useMutation({
		mutationFn: async (target: Node) => {
			const siblings = sortedSiblings(tree, target);
			const idx = siblings.findIndex((n) => n.id === target.id);

			if (idx === -1 || idx >= siblings.length - 1) return null;

			const next = siblings[idx + 1];
			const nextNext =
				idx + 2 < siblings.length ? siblings[idx + 2] : undefined;
			const nextOrder = getSiblingOrder(next) ?? null;
			const nextNextOrder = nextNext
				? (getSiblingOrder(nextNext) ?? null)
				: null;

			return moveNodeMutation.mutateAsync({
				id: target.id,
				order: generateKeyBetween(nextOrder, nextNextOrder),
			});
		},
		onSuccess: invalidateNodes,
	});

	const indentNodeMutation = useMutation({
		mutationFn: async (node: Node) => {
			const siblings = tree.get(node.parentId ?? "__root__") || [];
			const idx = siblings.findIndex((n) => n.id === node.id);
			if (idx > 0) {
				const prevSibling = siblings[idx - 1];
				return client.nodeActionsRouter.indentNode({
					id: node.id,
					parentId: prevSibling.id,
				});
			}
			return null;
		},
		onSuccess: invalidateNodes,
	});

	const outdentNodeMutation = useMutation({
		mutationFn: async (node: Node) => {
			if (!node.parentId) return null;
			let parent: Node | undefined;
			for (const siblings of tree.values()) {
				parent = siblings.find((n) => n.id === node.parentId);
				if (parent) break;
			}
			if (parent) {
				return client.nodeActionsRouter.outdentNode({
					id: node.id,
					parentId: parent.parentId ?? null,
				});
			}
			return null;
		},
		onSuccess: invalidateNodes,
	});

	return {
		moveUpMutation,
		moveDownMutation,
		indentNodeMutation,
		outdentNodeMutation,
	};
};
