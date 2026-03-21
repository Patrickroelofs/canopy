import { useDebouncer } from "@tanstack/react-pacer";
import { useMutation } from "@tanstack/react-query";
import type { Node } from "@/db/schemas/node-schema";
import { getContext } from "@/lib/root-provider";
import { client } from "@/orpc/client";

interface TypographyNodeProps {
	node: Node;
}

export const TypographyNode = ({ node }: TypographyNodeProps) => {
	const { queryClient } = getContext();

	const updateContentMutation = useMutation({
		mutationFn: ({ id, content }: { id: string; content: string }) =>
			client.nodeRouter.update({ id, content }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["nodes", "all"] });
		},
	});

	const contentDebouncer = useDebouncer(
		(content: string) => {
			if (content !== node.content) {
				updateContentMutation.mutate({ id: node.id, content });
			}
		},
		{ wait: 500, onUnmount: (d) => d.flush() },
	);

	return (
		<div className="group flex items-start gap-2 px-1 py-1 hover:bg-muted/40 rounded-lg">
			<span
				aria-hidden
				className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/50 transition-colors group-hover:bg-foreground/60"
			/>
			<p
				className="min-w-0 flex-1 leading-6 text-foreground wrap-break-word"
				contentEditable
				suppressContentEditableWarning
				onInput={(e) => {
					contentDebouncer.maybeExecute(e.currentTarget.textContent ?? "");
				}}
				onBlur={() => contentDebouncer.flush()}
			>
				{node.content}
			</p>
		</div>
	);
};
