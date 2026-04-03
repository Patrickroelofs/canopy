import { type InferSelectModel, relations } from "drizzle-orm";
import {
	foreignKey,
	jsonb,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import type { SerializedEditorState } from "lexical";
import { user } from "./auth-schema";

export const nodes = pgTable(
	"nodes",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		content: jsonb("content").$type<SerializedEditorState>().notNull(),

		parentId: uuid("parent_id"),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),

		createdAt: timestamp("created_at").defaultNow(),
		lastModified: timestamp("updated_at").defaultNow(),
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
	user: one(user, {
		fields: [nodes.userId],
		references: [user.id],
	}),
}));
