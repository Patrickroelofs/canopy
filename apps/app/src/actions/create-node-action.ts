import { useMutation } from "@tanstack/react-query";
import type { SerializedEditorState } from "lexical";
import type { Node } from "@/db/schemas/node-schema";
import { client } from "@/orpc/client";

interface CreateNodeProps {
	nodeId: string;
	content: SerializedEditorState;
	type: Node["type"];
}

export const useCreateNodeAction = ({
	invalidateNodes,
}: {
	invalidateNodes: () => void;
}) =>
	useMutation({
		mutationFn: ({ content, type }: CreateNodeProps) =>
			client.nodeRouter.create({ content, type }),
		onSuccess: invalidateNodes,
	});
