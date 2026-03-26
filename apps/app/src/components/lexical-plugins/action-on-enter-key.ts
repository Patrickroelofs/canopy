import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { COMMAND_PRIORITY_HIGH, KEY_ENTER_COMMAND } from "lexical";
import { useEffect } from "react";

type DisableEnterKeyProps = {
	onEnter: () => void;
};

export function ActionOnEnterKey({ onEnter }: DisableEnterKeyProps) {
	const [editor] = useLexicalComposerContext();

	useEffect(() => {
		return editor.registerCommand(
			KEY_ENTER_COMMAND,
			(event: KeyboardEvent) => {
				// Allow Shift+Enter to create newlines
				if (event.shiftKey) {
					return false;
				}

				// Block plain Enter
				event.preventDefault();
				onEnter();
				return true;
			},
			COMMAND_PRIORITY_HIGH,
		);
	}, [editor, onEnter]);

	return null;
}
