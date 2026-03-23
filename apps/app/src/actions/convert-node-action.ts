import { useMutation } from "@tanstack/react-query";
import type { Node } from "@/db/schemas/node-schema";
import { client } from "@/orpc/client";

interface ConvertNodeProps {
	nodeId: string;
	type: Node["type"];
}

export const useConvertNodeAction = ({
	invalidateNodes,
}: {
	invalidateNodes: () => void;
}) =>
	useMutation({
		mutationFn: ({ nodeId, type }: ConvertNodeProps) =>
			client.nodeRouter.update({
				id: nodeId,
				type: type,
			}),
		onSuccess: invalidateNodes,
	});
