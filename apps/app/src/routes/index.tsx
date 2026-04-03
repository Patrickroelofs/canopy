import { createFileRoute } from "@tanstack/react-router";
import { useListNodesAction } from "@/actions/list-nodes-action";
import { Authenticate } from "@/components/authenticate";
import { CreateNewNode } from "@/components/nodes/create-new-node";
import { renderTree } from "@/components/tree-renderer";
import { TreeSkeleton } from "@/components/tree-skeleton";
import { authClient } from "@/integrations/better-auth/auth-client";

export const Route = createFileRoute("/")({ component: App });

function App() {
	const { data: session } = authClient.useSession();
	const {
		data: tree,
		isLoading,
		isEnabled,
	} = useListNodesAction({
		enabled: !!session,
	});

	return (
		<div className="px-4 py-8 sm:px-6 lg:px-8">
			<div className="mx-auto max-w-7xl">
				<div className="mb-10 flex justify-end">
					<Authenticate />
				</div>
				{isLoading || !isEnabled ? (
					<TreeSkeleton />
				) : (
					<>
						{renderTree(tree)}
						<CreateNewNode />
					</>
				)}
			</div>
		</div>
	);
}
