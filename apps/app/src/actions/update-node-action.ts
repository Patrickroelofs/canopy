import { useMutation } from "@tanstack/react-query";
import type { SerializedEditorState } from "lexical";
import { client } from "@/orpc/client";

interface SaveNodeProps {
	nodeId: string;
	content: SerializedEditorState;
}

export const useUpdateNodeAction = ({
	invalidateNodes,
}: {
	invalidateNodes: () => void;
}) =>
	useMutation({
		mutationFn: ({ nodeId, content }: SaveNodeProps) =>
			client.nodeRouter.update({ id: nodeId, content }),
		onSuccess: invalidateNodes,
	});
