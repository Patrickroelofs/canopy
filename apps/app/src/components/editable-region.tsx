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
import { useCallback, useEffect, useMemo, useRef, memo } from "react";
import { EMPTY_STATE, useCreateNodeAction } from "@/actions/create-node-action";
import { useDeleteNodeAction } from "@/actions/delete-node-action";
import { useUpdateNodeAction } from "@/actions/update-node-action";
import type { Node } from "@/db/schemas/node-schema";
import { getApplicationContext } from "@/lib/root-provider";
import { ActionOnBackspaceKey } from "./lexical-plugins/action-on-backspace-key";
import { ActionOnEnterKey } from "./lexical-plugins/action-on-enter-key.ts";
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

export const EditableRegion = memo(function EditableRegion({ node }: EditableRegionProps) {
	const { queryClient } = getApplicationContext();
	const initialState = useMemo(
		() => ensureNonEmptyState(node.content),
		[node.content],
	);
	const initialStateString = JSON.stringify(initialState);
	const lastContentRef = useRef<string>(initialStateString);
	const contentEditableRef = useRef<HTMLDivElement>(null);

	const { mutate } = useUpdateNodeAction({
		invalidateNodes: () => {
			queryClient.invalidateQueries({ queryKey: ["nodes", "all"] });
		},
	});

	const { mutate: deleteNodeMutate } = useDeleteNodeAction({
		invalidateNodes: () => {
			queryClient.invalidateQueries({ queryKey: ["nodes", "all"] });
		},
	});

	const { mutate: createNodeMutate } = useCreateNodeAction({
		invalidateNodes: () => {
			queryClient.invalidateQueries({ queryKey: ["nodes", "all"] });
		},
	});

	useEffect(() => {
		if (contentEditableRef.current) {
			contentEditableRef.current.focus();
		}
	}, []);

	const handleEnter = useCallback(() => {
		const targetParentId = node.parentId ?? null;

		createNodeMutate({
			parentId: targetParentId,
		});
	}, [node.parentId, createNodeMutate]);

	const handleBackspace = useCallback(() => {
		const currentElement = contentEditableRef.current;
		const editableElements = Array.from(
			document.querySelectorAll<HTMLDivElement>(
				".editable-region[data-node-id]",
			),
		);
		const currentIndex = currentElement
			? editableElements.indexOf(currentElement)
			: -1;
		const previousEditableElement =
			currentIndex > 0 ? editableElements[currentIndex - 1] : null;

		deleteNodeMutate(node.id, {
			onSuccess: () => {
				if (!previousEditableElement) {
					return;
				}

				previousEditableElement.focus();

				const range = document.createRange();
				range.selectNodeContents(previousEditableElement);
				range.collapse(false);
				const selection = window.getSelection();
				if (selection) {
					selection.removeAllRanges();
					selection.addRange(range);
				}
			},
		});
	}, [deleteNodeMutate, node.id]);

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
		<div className="block w-full">
			<LexicalComposer initialConfig={initialConfig}>
				<RichTextPlugin
					contentEditable={
						<ContentEditable
							ref={contentEditableRef}
							data-node-id={node.id}
							aria-placeholder={"Enter some text..."}
							className="editable-region"
							placeholder={<span className="w-full"></span>}
						/>
					}
					ErrorBoundary={LexicalErrorBoundary}
				/>

				<DisableDefaultFeaturesPlugin />
				<ActionOnEnterKey onEnter={handleEnter} />
				<ActionOnBackspaceKey onBackspace={handleBackspace} />
				<OnChangePlugin onChange={handleChange} />
			</LexicalComposer>
		</div>
	);
});
