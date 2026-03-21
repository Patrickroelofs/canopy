import { os } from "@orpc/server";
import { eq, isNull } from "drizzle-orm";
import z from "zod";
import { db } from "@/db";
import { nodes } from "@/db/schemas/node-schema";
import {
	compareNodesByPosition,
	generatePositionBetween,
	positionValue,
} from "@/lib/position";

export const nodeRouter = os.router({
	list: os.handler(async () => {
		const items = await db.select().from(nodes);

		return items;
	}),

	create: os
		.input(
			z.object({
				content: z.string().optional(),
				parentId: z.string().nullable().optional(),
				position: z.string().optional(),
				afterId: z.string().optional(),
				beforeId: z.string().optional(),
				metadata: z
					.object({
						type: z.enum(["paragraph", "task"]),
						taskCompleted: z.boolean().optional(),
						expanded: z.boolean().optional(),
					})
					.optional(),
			}),
		)
		.handler(async ({ input }) => {
			let position = positionValue(input.position);

			if (!position) {
				const siblings = input.parentId
					? await db
							.select()
							.from(nodes)
							.where(eq(nodes.parentId, input.parentId))
					: await db.select().from(nodes).where(isNull(nodes.parentId));

				const orderedSiblings = [...siblings].sort(compareNodesByPosition);
				let beforePosition: string | null = null;
				let afterPosition: string | null = null;
				let hasPlacement = false;

				if (input.afterId) {
					const afterIndex = orderedSiblings.findIndex(
						(sibling) => sibling.id === input.afterId,
					);

					if (afterIndex >= 0) {
						hasPlacement = true;
						beforePosition = orderedSiblings[afterIndex]?.position;
						afterPosition = orderedSiblings[afterIndex + 1]?.position ?? null;
					}
				}

				if (!hasPlacement && input.beforeId) {
					const beforeIndex = orderedSiblings.findIndex(
						(sibling) => sibling.id === input.beforeId,
					);

					if (beforeIndex >= 0) {
						hasPlacement = true;
						beforePosition = orderedSiblings[beforeIndex - 1]?.position ?? null;
						afterPosition = orderedSiblings[beforeIndex]?.position ?? null;
					}
				}

				if (!hasPlacement) {
					beforePosition = orderedSiblings.at(-1)?.position ?? null;
				}

				position = generatePositionBetween(beforePosition, afterPosition);
			}

			const [item] = await db
				.insert(nodes)
				.values({
					content: input.content,
					parentId: input.parentId,
					position,
					metadata: input.metadata,
				})
				.returning();

			return item;
		}),

	read: os
		.input(
			z.object({
				id: z.string(),
			}),
		)
		.handler(async ({ input }) => {
			const item = await db.select().from(nodes).where(eq(nodes.id, input.id));

			return item;
		}),

	update: os
		.input(
			z.object({
				id: z.string(),
				content: z.string().optional(),
				parentId: z.string().nullable().optional(),
				position: z.string().optional(),
				metadata: z
					.object({
						type: z.enum(["paragraph", "task"]),
						taskCompleted: z.boolean().optional(),
						expanded: z.boolean().optional(),
					})
					.optional(),
			}),
		)
		.handler(async ({ input }) => {
			const [result] = await db
				.update(nodes)
				.set(input)
				.where(eq(nodes.id, input.id))
				.returning();

			if (!result) {
				throw new Error(`Node with id ${input.id} not found`);
			}

			return result;
		}),

	delete: os
		.input(
			z.object({
				id: z.string(),
			}),
		)
		.handler(async ({ input }) => {
			const result = await db.delete(nodes).where(eq(nodes.id, input.id));

			if (result.rowCount === 0) {
				throw new Error(`Node with id ${input.id} not found`);
			}

			return { success: true };
		}),
});
