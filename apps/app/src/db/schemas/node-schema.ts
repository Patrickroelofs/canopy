import { type InferSelectModel, relations } from "drizzle-orm";
import {
	foreignKey,
	jsonb,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";

export const nodes = pgTable(
	"nodes",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		content: text("content").notNull().default(""),

		parentId: uuid("parent_id"),

		createdAt: timestamp("created_at").defaultNow(),
		lastModified: timestamp("updated_at").defaultNow(),

		type: text("type").notNull().default("paragraph").$type<"paragraph">(),
		metadata: jsonb("metadata")
			.$type<{
				taskCompleted?: boolean;
				expanded?: boolean;
			}>()
			.default({}),
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
