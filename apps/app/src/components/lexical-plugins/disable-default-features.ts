import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { FORMAT_TEXT_COMMAND } from "lexical";
import { useEffect } from "react";

export function DisableDefaultFeaturesPlugin() {
	const [editor] = useLexicalComposerContext();

	useEffect(() => {
		return editor.registerCommand(
			FORMAT_TEXT_COMMAND,
			(type) => {
				if (type === "bold" || type === "italic") {
					return false;
				}

				return true;
			},
			1,
		);
	}, [editor]);

	return null;
}
