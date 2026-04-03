import { drizzle } from "drizzle-orm/node-postgres";
import { env } from "@/env";

import * as authSchema from "./schemas/auth-schema";
import * as nodeSchema from "./schemas/node-schema";

export const db = drizzle(env.DATABASE_URL, {
	schema: {
		...authSchema,
		...nodeSchema,
	},
});
