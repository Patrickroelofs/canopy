import { PlusIcon } from "@phosphor-icons/react";
import { useMutation } from "@tanstack/react-query";
import { getApplicationContext } from "@/lib/root-provider";
import { client } from "@/orpc/client";
import { Button } from "../ui/button";

export const CreateNewNode = () => {
	const { queryClient } = getApplicationContext();

	const createNewNodeMutation = useMutation({
		mutationFn: () =>
			client.nodeRouter.create({
				content: "",
				type: "paragraph",
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["nodes", "all"] });
		},
	});

	const handleCreateNewNode = () => {
		createNewNodeMutation.mutate();
	};

	return (
		<div className="group flex items-start gap-3 px-1 py-1">
			<Button variant="ghost" size="icon" onClick={handleCreateNewNode}>
				<PlusIcon className="h-3 w-3 text-muted-foreground" />
			</Button>
		</div>
	);
};
