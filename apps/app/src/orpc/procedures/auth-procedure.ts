import { os } from "@orpc/server";
import { getSession } from "@/integrations/better-auth/auth-server";

const authProcedure = os.use(async ({ next }) => {
	const session = await getSession();

	if (!session) {
		throw new Error("UNAUTHORIZED");
	}

	return next({ context: { user: session.user } });
});

export { authProcedure };
