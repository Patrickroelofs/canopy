import { useMutation } from "@tanstack/react-query";
import { client } from "@/orpc/client";

export const useDeleteNodeAction = ({
	invalidateNodes,
}: {
	invalidateNodes: () => void;
}) =>
	useMutation({
		mutationFn: (id: string) => client.nodeRouter.delete({ id }),
		onSuccess: invalidateNodes,
	});
