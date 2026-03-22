import {
	type InitialConfigType,
	LexicalComposer,
} from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { debounce } from "@tanstack/react-pacer";
import type { EditorState } from "lexical";
import { useCallback, useMemo, useRef } from "react";
import { useUpdateNodeAction } from "@/actions/update-node-action";
import type { Node } from "@/db/schemas/node-schema";
import { getApplicationContext } from "@/lib/root-provider";

interface EditableRegionProps {
	node: Node;
}

const EMPTY_STATE =
	'{"root":{"children":[{"children":[],"direction":null,"format":"","indent":0,"type":"paragraph","version":1}],"direction":null,"format":"","indent":0,"type":"root","version":1}}';

export const EditableRegion = ({ node }: EditableRegionProps) => {
	const { queryClient } = getApplicationContext();
	const lastContentRef = useRef(
		node.content ? JSON.stringify(node.content) : EMPTY_STATE,
	);

	const { mutate } = useUpdateNodeAction({
		invalidateNodes: () => {
			queryClient.invalidateQueries({ queryKey: ["nodes", "all"] });
		},
	});

	const debouncedSave = useMemo(
		() =>
			debounce(
				(content) => {
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
		editorState: node.content ? JSON.stringify(node.content) : EMPTY_STATE,
	};

	const handleChange = useCallback(
		(editorState: EditorState) => {
			editorState.read(() => {
				const contentString = JSON.stringify(editorState.toJSON());

				if (contentString !== lastContentRef.current) {
					lastContentRef.current = contentString;
					debouncedSave(contentString);
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
							placeholder={<span className="w-full"></span>}
						/>
					}
					ErrorBoundary={LexicalErrorBoundary}
				/>
				<OnChangePlugin onChange={handleChange} />
			</LexicalComposer>
		</div>
	);
};
