import { useMutation } from "@tanstack/react-query";
import type { SerializedEditorState } from "lexical";
import { client } from "@/orpc/client";

export const EMPTY_STATE: SerializedEditorState = {
	root: {
		children: [
			{
				type: "paragraph",
				version: 1,
			},
		],
		direction: null,
		format: "",
		indent: 0,
		type: "root",
		version: 1,
	},
} as SerializedEditorState;

export const useCreateNodeAction = ({
	invalidateNodes,
}: {
	invalidateNodes: () => void;
}) =>
	useMutation({
		mutationFn: (options?: { parentId?: string | null; order?: string }) =>
			client.nodeRouter.create({
				content: EMPTY_STATE,
				type: "paragraph",
				parentId: options?.parentId,
				order: options?.order,
			}),
		onSuccess: invalidateNodes,
	});
