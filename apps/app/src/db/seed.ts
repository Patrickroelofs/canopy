import { randomUUID } from "node:crypto";
import { faker } from "@faker-js/faker";
import { config as loadEnv } from "dotenv";
import { generateKeyBetween } from "fractional-indexing";
import type { SerializedEditorState } from "lexical";
import { nodes } from "./schemas/node-schema.ts";

loadEnv({ path: ".env" });
loadEnv({ path: ".env.local", override: true });

const TOTAL_NODES = Number.parseInt(process.env.SEED_TOTAL_NODES ?? "1200", 10);
const ROOT_NODES = Number.parseInt(process.env.SEED_ROOT_NODES ?? "24", 10);
const MAX_DEPTH = Number.parseInt(process.env.SEED_MAX_DEPTH ?? "6", 10);
const MAX_CHILDREN_PER_PARENT = Number.parseInt(
	process.env.SEED_MAX_CHILDREN_PER_PARENT ?? "8",
	10,
);
const INSERT_CHUNK_SIZE = Number.parseInt(
	process.env.SEED_INSERT_CHUNK_SIZE ?? "250",
	10,
);
const RNG_SEED = process.env.SEED_RANDOM;

type SeedRow = typeof nodes.$inferInsert;
type CandidateParent = {
	id: string;
	depth: number;
	children: number;
};

const orderByGroup = new Map<string, string | null>();

const nextOrder = (groupKey: string): string => {
	const previous = orderByGroup.get(groupKey) ?? null;
	const next = generateKeyBetween(previous, null);
	orderByGroup.set(groupKey, next);
	return next;
};

const createContentState = (text: string): SerializedEditorState =>
	({
		root: {
			children: [
				{
					children: [
						{
							detail: 0,
							format: 0,
							mode: "normal",
							style: "",
							text,
							type: "text",
							version: 1,
						},
					],
					direction: null,
					format: "",
					indent: 0,
					textFormat: 0,
					textStyle: "",
					type: "paragraph",
					version: 1,
				},
			],
			direction: null,
			format: "",
			indent: 0,
			type: "root",
			version: 1,
		},
	}) as unknown as SerializedEditorState;

const createMetadata = (isRoot: boolean): SeedRow["metadata"] => ({
	expanded: isRoot ? true : faker.datatype.boolean({ probability: 0.3 }),
	taskCompleted: faker.datatype.boolean({ probability: 0.25 }),
});

const createSeedRows = (): SeedRow[] => {
	if (RNG_SEED) {
		faker.seed(Number.parseInt(RNG_SEED, 10));
	}

	const rows: SeedRow[] = [];
	const candidateParents: CandidateParent[] = [];

	const createRoot = () => {
		const id = randomUUID();
		const title = faker.lorem.sentence({ min: 2, max: 8 });
		rows.push({
			id,
			parentId: null,
			type: "paragraph",
			order: nextOrder("__root__"),
			metadata: createMetadata(true),
			content: createContentState(title),
		});
		candidateParents.push({ id, depth: 0, children: 0 });
	};

	for (
		let index = 0;
		index < ROOT_NODES && rows.length < TOTAL_NODES;
		index += 1
	) {
		createRoot();
	}

	while (rows.length < TOTAL_NODES) {
		if (candidateParents.length === 0) {
			createRoot();
			continue;
		}

		const parentIndex = faker.number.int({
			min: 0,
			max: candidateParents.length - 1,
		});
		const parent = candidateParents[parentIndex];
		const depth = parent.depth + 1;
		const id = randomUUID();
		const sentence = faker.lorem.sentence({ min: 3, max: 12 });

		rows.push({
			id,
			parentId: parent.id,
			type: "paragraph",
			order: nextOrder(parent.id),
			metadata: createMetadata(false),
			content: createContentState(sentence),
		});

		parent.children += 1;
		if (
			parent.children >= MAX_CHILDREN_PER_PARENT ||
			parent.depth >= MAX_DEPTH - 1
		) {
			candidateParents.splice(parentIndex, 1);
		}

		const canHaveChildren = depth < MAX_DEPTH;
		if (canHaveChildren) {
			const childProbability = depth <= 1 ? 0.9 : depth <= 3 ? 0.65 : 0.35;
			if (faker.datatype.boolean({ probability: childProbability })) {
				candidateParents.push({ id, depth, children: 0 });
			}
		}
	}

	return rows;
};

const insertInChunks = async (rows: SeedRow[]) => {
	const { db } = await import("./index.ts");

	await db.transaction(async (transaction) => {
		await transaction.delete(nodes);

		for (
			let chunkStart = 0;
			chunkStart < rows.length;
			chunkStart += INSERT_CHUNK_SIZE
		) {
			const chunk = rows.slice(chunkStart, chunkStart + INSERT_CHUNK_SIZE);
			await transaction.insert(nodes).values(chunk);
		}
	});
};

const run = async () => {
	const startedAt = Date.now();
	const rows = createSeedRows();
	const rootCount = rows.filter((row) => row.parentId === null).length;

	await insertInChunks(rows);

	const durationMs = Date.now() - startedAt;
	console.log(
		[
			"Seed completed",
			`- total rows: ${rows.length}`,
			`- roots: ${rootCount}`,
			`- children: ${rows.length - rootCount}`,
			`- elapsed: ${durationMs}ms`,
		].join("\n"),
	);
};

run()
	.then(() => {
		process.exit(0);
	})
	.catch((error: unknown) => {
		console.error("Seed failed", error);
		process.exit(1);
	});
