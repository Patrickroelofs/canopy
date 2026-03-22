import { useQuery } from "@tanstack/react-query";
import { client } from "@/orpc/client";

export const useListNodesAction = () => {
	return useQuery({
		queryKey: ["nodes", "all"],
		queryFn: () => client.nodeRouter.list(),
	});
};
