import { os } from "@orpc/server";
import { eq } from "drizzle-orm";
import z from "zod";
import { db } from "@/db";
import { jsonbSet } from "@/db/helpers/jsonb-helpers";
import { nodes } from "@/db/schemas/node-schema";

export const nodeActionsRouter = os.router({
	toggleExpanded: os
		.input(
			z.object({
				id: z.string(),
				expanded: z.boolean(),
			}),
		)
		.handler(async ({ input }) => {
			const [item] = await db
				.update(nodes)
				.set({
					metadata: jsonbSet(nodes.metadata, ["expanded"], input.expanded),
				})
				.where(eq(nodes.id, input.id))
				.returning();

			return item;
		}),

	toggleTaskCompleted: os
		.input(
			z.object({
				id: z.string(),
				taskCompleted: z.boolean(),
			}),
		)
		.handler(async ({ input }) => {
			const [item] = await db
				.update(nodes)
				.set({
					metadata: jsonbSet(
						nodes.metadata,
						["taskCompleted"],
						input.taskCompleted,
					),
				})
				.where(eq(nodes.id, input.id))
				.returning();

			return item;
		}),
});
