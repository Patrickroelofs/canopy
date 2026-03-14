import { type InferSelectModel, relations } from "drizzle-orm";
import {
	foreignKey,
	jsonb,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import z from "zod";

export const nodes = pgTable(
	"nodes",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		content: text("content").notNull().default(""),

		parentId: uuid("parent_id"),
		position: text("position").notNull(),

		createdAt: timestamp("created_at").defaultNow(),
		lastModified: timestamp("updated_at").defaultNow(),

		metadata: jsonb("metadata")
			.$type<{
				type: "paragraph" | "task";
				taskCompleted?: boolean;
				expanded?: boolean;
			}>()
			.default({
				type: "paragraph",
			}),
	},
	(table) => [
		foreignKey({
			columns: [table.parentId],
			foreignColumns: [table.id],
		}).onDelete("cascade"),
	],
);

export type Node = InferSelectModel<typeof nodes>;

export const nodesRelations = relations(nodes, ({ one, many }) => ({
	parent: one(nodes, {
		fields: [nodes.parentId],
		references: [nodes.id],
		relationName: "NodeHierarchy",
	}),
	children: many(nodes, {
		relationName: "NodeHierarchy",
	}),
}));
