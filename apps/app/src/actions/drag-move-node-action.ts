import { useMutation } from "@tanstack/react-query";
import { LIST_NODES_QUERY_KEY } from "@/actions/list-nodes-action";
import type { Node } from "@/db/schemas/node-schema";
import { getApplicationContext } from "@/lib/root-provider";
import { client } from "@/orpc/client";

interface DragMoveInput {
	id: string;
	parentId: string | null;
	order: string;
}

export const useDragMoveNodeAction = () => {
	const { queryClient } = getApplicationContext();

	return useMutation({
		mutationFn: ({ id, parentId, order }: DragMoveInput) =>
			client.nodeActionsRouter.dragMoveNode({ id, parentId, order }),

		onMutate: async ({ id, parentId, order }) => {
			await queryClient.cancelQueries({ queryKey: LIST_NODES_QUERY_KEY });

			const previousNodes =
				queryClient.getQueryData<Node[]>(LIST_NODES_QUERY_KEY);

			if (previousNodes) {
				queryClient.setQueryData<Node[]>(
					LIST_NODES_QUERY_KEY,
					previousNodes.map((node) =>
						node.id === id ? { ...node, parentId, order } : node,
					),
				);
			}

			return { previousNodes };
		},

		onError: (_error, _variables, context) => {
			if (context?.previousNodes) {
				queryClient.setQueryData(LIST_NODES_QUERY_KEY, context.previousNodes);
			}
		},

		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: LIST_NODES_QUERY_KEY });
		},
	});
};
