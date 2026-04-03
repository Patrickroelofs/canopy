import { eq } from "drizzle-orm";
import type { SerializedEditorState, SerializedLexicalNode } from "lexical";
import z from "zod";
import { db } from "@/db";
import { nodes } from "@/db/schemas/node-schema";
import { authProcedure } from "../procedures/auth-procedure";

export const nodeRouter = authProcedure.router({
	list: authProcedure.handler(async () => {
		const items = await db.select().from(nodes);

		return items;
	}),

	create: authProcedure
		.input(
			z.object({
				content: z.custom<SerializedEditorState<SerializedLexicalNode>>(),
				type: z.enum(["paragraph"]).optional(),
			}),
		)
		.handler(async ({ input, context }) => {
			const [item] = await db
				.insert(nodes)
				.values({
					userId: context.user.id,
					content: input.content,
				})
				.returning();

			return item;
		}),

	delete: authProcedure
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
