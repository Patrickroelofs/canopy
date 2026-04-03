import { sql } from "drizzle-orm";

export function jsonbSet<T>(
	column: unknown,
	path: (keyof T | string)[],
	value: unknown,
) {
	const pgPath = `{${path.join(",")}}`;
	return sql`jsonb_set(${column}, ${pgPath}, ${JSON.stringify(value)}::jsonb, true)`;
}
