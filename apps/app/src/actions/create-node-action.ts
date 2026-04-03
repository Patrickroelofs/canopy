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
		mutationFn: () =>
			client.nodeRouter.create({
				content: EMPTY_STATE,
			}),
		onSuccess: invalidateNodes,
	});
