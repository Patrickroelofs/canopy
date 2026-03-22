import { useMutation } from "@tanstack/react-query";
import { getApplicationContext } from "@/lib/root-provider";
import { client } from "@/orpc/client";

type ToggleExpandedAction = {
	id: string;
	expanded: boolean;
};

export const useExpandNodeAction = () => {
	const { queryClient } = getApplicationContext();

	return useMutation({
		mutationFn: ({ id, expanded }: ToggleExpandedAction) =>
			client.nodeActionsRouter.toggleExpanded({ id, expanded }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["nodes", "all"] });
		},
	});
};
