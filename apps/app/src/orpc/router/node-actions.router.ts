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

	indentNode: os
		.input(
			z.object({
				id: z.string(),
				parentId: z.string(),
			}),
		)
		.handler(async ({ input }) => {
			await db
				.update(nodes)
				.set({
					parentId: input.parentId,
				})
				.where(eq(nodes.id, input.id))
				.returning();

			return { success: true };
		}),

	outdentNode: os
		.input(
			z.object({
				id: z.string(),
				parentId: z.string().nullable(),
			}),
		)
		.handler(async ({ input }) => {
			await db
				.update(nodes)
				.set({
					parentId: input.parentId,
				})
				.where(eq(nodes.id, input.id))
				.returning();

			return { success: true };
		}),
});
