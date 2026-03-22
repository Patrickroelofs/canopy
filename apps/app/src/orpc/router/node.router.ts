import { os } from "@orpc/server";
import { eq, isNull } from "drizzle-orm";
import { generateKeyBetween } from "fractional-indexing";
import type { SerializedEditorState } from "lexical";
import z from "zod";
import { db } from "@/db";
import { nodes } from "@/db/schemas/node-schema";

export const nodeRouter = os.router({
	list: os.handler(async () => {
		const items = await db.select().from(nodes);

		return items;
	}),

	create: os
		.input(
			z.object({
				content: z.custom<SerializedEditorState>(),
				parentId: z.string().nullable().optional(),
				afterId: z.string().optional(),
				beforeId: z.string().optional(),
				type: z.enum(["paragraph"]).optional(),
				order: z.string().optional(),
				metadata: z
					.object({
						taskCompleted: z.boolean().optional(),
						expanded: z.boolean().optional(),
					})
					.optional(),
			}),
		)
		.handler(async ({ input }) => {
			const siblings = await db
				.select({ order: nodes.order })
				.from(nodes)
				.where(
					input.parentId
						? eq(nodes.parentId, input.parentId)
						: isNull(nodes.parentId),
				);

			const lastOrderKey = siblings
				.map((sibling) => sibling.order)
				.filter((key): key is string => typeof key === "string")
				.sort((a, b) => {
					if (a < b) return -1;
					if (a > b) return 1;
					return 0;
				})
				.at(-1);

			const nextOrderKey = input.order
				? input.order
				: generateKeyBetween(lastOrderKey ?? null, null);

			const [item] = await db
				.insert(nodes)
				.values({
					content: input.content,
					parentId: input.parentId,
					metadata: {
						...input.metadata,
					},
					type: input.type,
					order: nextOrderKey,
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
				content: z.custom<SerializedEditorState>().optional(),
				parentId: z.string().nullable().optional(),
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
