import { drizzle } from "drizzle-orm/node-postgres";
import { env } from "@/env.ts";

import * as authSchema from "./schemas/auth-schema.ts";

export const db = drizzle(env.DATABASE_URL, {
	schema: {
		...authSchema,
	},
});
