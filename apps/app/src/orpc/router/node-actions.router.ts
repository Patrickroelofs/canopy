import { os } from "@orpc/server";
import { eq, isNull } from "drizzle-orm";
import { generateKeyBetween } from "fractional-indexing";
import z from "zod";
import { db } from "@/db";
import { jsonbSet } from "@/db/helpers/jsonb-helpers";
import { nodes } from "@/db/schemas/node-schema";

async function getNextOrderKey(parentId: string | null) {
	const siblings = await db
		.select({ order: nodes.order })
		.from(nodes)
		.where(parentId ? eq(nodes.parentId, parentId) : isNull(nodes.parentId));

	const lastOrderKey = siblings
		.map((sibling) => sibling.order)
		.filter((key): key is string => typeof key === "string")
		.sort((a, b) => {
			if (a < b) return -1;
			if (a > b) return 1;
			return 0;
		})
		.at(-1);

	return generateKeyBetween(lastOrderKey ?? null, null);
}

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
			const nextOrderKey = await getNextOrderKey(input.parentId);

			await db
				.update(nodes)
				.set({
					parentId: input.parentId,
					order: nextOrderKey,
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
			const nextOrderKey = await getNextOrderKey(input.parentId);

			await db
				.update(nodes)
				.set({
					parentId: input.parentId,
					order: nextOrderKey,
				})
				.where(eq(nodes.id, input.id))
				.returning();

			return { success: true };
		}),

	moveNode: os
		.input(
			z.object({
				id: z.string(),
				order: z.string(),
			}),
		)
		.handler(async ({ input }) => {
			await db
				.update(nodes)
				.set({
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
