import {
	type InitialConfigType,
	LexicalComposer,
} from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { debounce } from "@tanstack/react-pacer";
import type { EditorState, SerializedEditorState } from "lexical";
import { useCallback, useMemo, useRef } from "react";
import { EMPTY_STATE } from "@/actions/create-node-action";
import { useUpdateNodeAction } from "@/actions/update-node-action";
import type { Node } from "@/db/schemas/node-schema";
import { getApplicationContext } from "@/lib/root-provider";
import { DisableDefaultFeaturesPlugin } from "./lexical-plugins/disable-default-features";

interface EditableRegionProps {
	node: Node;
}

const ensureNonEmptyState = (
	content: SerializedEditorState,
): SerializedEditorState => {
	if (!content.root || !Array.isArray(content.root.children)) {
		return EMPTY_STATE;
	}

	return content;
};

export const EditableRegion = ({ node }: EditableRegionProps) => {
	const { queryClient } = getApplicationContext();
	const initialState = useMemo(
		() => ensureNonEmptyState(node.content),
		[node.content],
	);
	const initialStateString = JSON.stringify(initialState);
	const lastContentRef = useRef<string>(initialStateString);

	const { mutate } = useUpdateNodeAction({
		invalidateNodes: () => {
			queryClient.invalidateQueries({ queryKey: ["nodes", "all"] });
		},
	});

	const debouncedSave = useMemo(
		() =>
			debounce(
				(content: SerializedEditorState) => {
					mutate({ nodeId: node.id, content });
				},
				{ wait: 500 },
			),
		[mutate, node.id],
	);

	const initialConfig: InitialConfigType = {
		namespace: `editable-region-${node.id}`,
		theme: {},
		onError: (error) => console.error(error),
		editorState: initialStateString,
	};

	const handleChange = useCallback(
		(editorState: EditorState) => {
			editorState.read(() => {
				const content = editorState.toJSON();
				const contentString = JSON.stringify(content);

				if (contentString !== lastContentRef.current) {
					lastContentRef.current = contentString;
					debouncedSave(content);
				}
			});
		},
		[debouncedSave],
	);

	return (
		<div className="block w-94">
			<LexicalComposer initialConfig={initialConfig}>
				<RichTextPlugin
					contentEditable={
						<ContentEditable
							aria-placeholder={"Enter some text..."}
							className="editable-region"
							placeholder={<span className="w-full"></span>}
						/>
					}
					ErrorBoundary={LexicalErrorBoundary}
				/>

				<DisableDefaultFeaturesPlugin />
				<OnChangePlugin onChange={handleChange} />
			</LexicalComposer>
		</div>
	);
};
