import { useQuery } from "@tanstack/react-query";
import { client } from "@/orpc/client";

export const LIST_NODES_QUERY_KEY = ["nodes", "all"] as const;

export const useListNodesAction = ({ enabled }: { enabled?: boolean }) => {
	return useQuery({
		queryKey: LIST_NODES_QUERY_KEY,
		queryFn: () => client.nodeRouter.list(),
		enabled: enabled,
	});
};
