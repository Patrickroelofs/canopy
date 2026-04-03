import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
	$getRoot,
	$getSelection,
	$isRangeSelection,
	COMMAND_PRIORITY_HIGH,
	KEY_BACKSPACE_COMMAND,
} from "lexical";
import { useEffect } from "react";

type ActionOnBackspaceKeyProps = {
	onBackspace: () => void;
};

export function ActionOnBackspaceKey({ onBackspace }: ActionOnBackspaceKeyProps) {
	const [editor] = useLexicalComposerContext();

	useEffect(() => {
		return editor.registerCommand(
			KEY_BACKSPACE_COMMAND,
			(event: KeyboardEvent) => {
				let shouldDeleteNode = false;

				editor.getEditorState().read(() => {
					const root = $getRoot();
					const selection = $getSelection();
					const isCollapsedAtStart =
						$isRangeSelection(selection) &&
						selection.isCollapsed() &&
						selection.anchor.offset === 0;
					const isEmpty = root.getTextContent().trim().length === 0;

					shouldDeleteNode = isEmpty && isCollapsedAtStart;
				});

				if (!shouldDeleteNode) {
					return false;
				}

				event.preventDefault();
				onBackspace();
				return true;
			},
			COMMAND_PRIORITY_HIGH,
		);
	}, [editor, onBackspace]);

	return null;
}

