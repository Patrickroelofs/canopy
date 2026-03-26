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
			await db
				.update(nodes)
				.set({
					metadata: jsonbSet(nodes.metadata, ["expanded"], input.expanded),
				})
				.where(eq(nodes.id, input.id))
				.returning();

			return { success: true };
		}),

	dragMoveNode: os
		.input(
			z.object({
				id: z.string(),
				parentId: z.string().nullable(),
				order: z.string(),
			}),
		)
		.handler(async ({ input }) => {
			await db
				.update(nodes)
				.set({
					parentId: input.parentId,
					order: input.order,
				})
				.where(eq(nodes.id, input.id))
				.returning();

			return { success: true };
		}),

	toggleTaskCompleted: os
		.input(
			z.object({
				id: z.string(),
			}),
		)
		.handler(async ({ input }) => {
			const [node] = await db
				.select()
				.from(nodes)
				.where(eq(nodes.id, input.id));

			if (!node) {
				throw new Error(`Node with id ${input.id} not found`);
			}

			if (node.type !== "task") {
				throw new Error(`Node with id ${input.id} is not a task node`);
			}

			const currentCompleted = node.metadata?.taskCompleted ?? false;

			const [result] = await db
				.update(nodes)
				.set({
					metadata: jsonbSet(
						nodes.metadata,
						["taskCompleted"],
						!currentCompleted,
					),
				})
				.where(eq(nodes.id, input.id))
				.returning();

			if (!result) {
				throw new Error(`Node with id ${input.id} not found`);
			}

			return result;
		}),
});
