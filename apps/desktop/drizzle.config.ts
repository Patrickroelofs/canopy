import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: [".env.local", ".env"] });

export default defineConfig({
	out: "./drizzle",
	schema: "./src/db/schemas/",
	dialect: "sqlite",
	dbCredentials: {
		url: "file:local.db",
	},
});
