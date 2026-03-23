import { useMutation } from "@tanstack/react-query";
import { client } from "@/orpc/client";

interface CompleteTaskNodeActionProps {
	nodeId: string;
}

export const useToggleTaskNodeAction = ({
	invalidateNodes,
}: {
	invalidateNodes: () => void;
}) =>
	useMutation({
		mutationFn: ({ nodeId }: CompleteTaskNodeActionProps) =>
			client.nodeActionsRouter.toggleTaskCompleted({ id: nodeId }),
		onSuccess: invalidateNodes,
	});
