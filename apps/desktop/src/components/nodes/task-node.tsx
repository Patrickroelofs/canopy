import { useDebouncer } from "@tanstack/react-pacer";
import { useMutation } from "@tanstack/react-query";
import type { Node } from "@/db/schemas/node-schema";
import { getContext } from "@/lib/root-provider";
import { cn } from "@/lib/utils";
import { client } from "@/orpc/client";
import { Checkbox } from "../ui/checkbox";

interface TaskNodeProps {
	node: Node;
}

export const TaskNode = ({ node }: TaskNodeProps) => {
	const { queryClient } = getContext();

	const toggleTaskCompletedMutation = useMutation({
		mutationFn: ({
			id,
			taskCompleted,
		}: {
			id: string;
			taskCompleted: boolean;
		}) => client.nodeActionsRouter.toggleTaskCompleted({ id, taskCompleted }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["nodes", "all"] });
		},
	});

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

			<div className="flex items-center gap-1">
				<Checkbox
					checked={node.metadata?.taskCompleted || false}
					onCheckedChange={(checked) => {
						toggleTaskCompletedMutation.mutate({
							id: node.id,
							taskCompleted: checked,
						});
					}}
				/>
				<p
					className={cn(
						"min-w-0 flex-1 leading-6 text-foreground wrap-break-word",
						node.metadata?.taskCompleted &&
							"line-through text-muted-foreground",
					)}
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
		</div>
	);
};
