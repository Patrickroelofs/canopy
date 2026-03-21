import { debounce } from "@tanstack/react-pacer";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import type { Node } from "@/db/schemas/node-schema";
import { getApplicationContext } from "@/lib/root-provider";
import { client } from "@/orpc/client";

interface EditableRegionProps {
	node: Node;
	value: string;
}

export const EditableRegion = ({ node, value }: EditableRegionProps) => {
	const ref = useRef<HTMLParagraphElement>(null);
	const { queryClient } = getApplicationContext();

	const updateContentMutation = useMutation({
		mutationFn: ({ id, content }: { id: string; content: string }) =>
			client.nodeRouter.update({ id, content }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["nodes", "all"] });
		},
	});

	const contentDebouncer = debounce(
		(content: string) => {
			if (content !== node.content) {
				updateContentMutation.mutate({ id: node.id, content });
			}
		},
		{ wait: 500 },
	);

	useEffect(() => {
		if (ref.current && ref.current.innerText !== value) {
			ref.current.innerText = value ?? "";
		}
	}, [value]);

	const handleInput = (e: React.InputEvent<HTMLParagraphElement>) => {
		const nextContent = e.currentTarget.innerText;

		contentDebouncer(nextContent);
	};

	return (
		<p
			ref={ref}
			className="min-w-0 flex-1 leading-6 text-foreground wrap-break-word text-base focus:outline-2 focus:outline-offset-4 rounded-md"
			contentEditable
			suppressContentEditableWarning
			onInput={handleInput}
		/>
	);
};
