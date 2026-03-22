import { PlusIcon } from "@phosphor-icons/react";
import { useCreateNodeAction } from "@/actions/create-node-action";
import { getApplicationContext } from "@/lib/root-provider";
import { Button } from "../ui/button";

export const CreateNewNode = () => {
	const { queryClient } = getApplicationContext();

	const { mutate } = useCreateNodeAction({
		invalidateNodes: () =>
			queryClient.invalidateQueries({ queryKey: ["nodes", "all"] }),
	});

	const handleCreateNewNode = () => {
		mutate();
	};

	return (
		<div className="group flex items-start gap-3 px-1 py-1">
			<Button variant="outline" size="icon" onClick={handleCreateNewNode}>
				<PlusIcon className="h-3 w-3 text-muted-foreground" />
			</Button>
		</div>
	);
};
