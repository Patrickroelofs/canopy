import { resolve } from "node:path";
import { faker } from "@faker-js/faker";
import { config as loadEnv } from "dotenv";
import { generatePositionBetween } from "@/lib/position";

type NewNode = {
	id: string;
	content: string;
	parentId: string | null;
	position: string;
	metadata: {
		type: "paragraph" | "task";
		taskCompleted?: boolean;
		expanded?: boolean;
	};
};

const TOTAL_ITEMS = 5_000;
const BATCH_SIZE = 500;
const MIN_INITIAL_ROOTS = 20;
const ROOT_PROBABILITY = 0.08;
const CHAIN_PROBABILITY = 0.4;
const DEPTH_TOURNAMENT_SIZE = 6;
const FAKER_SEED = 20_260_315;

type NodeRef = {
	id: string;
	depth: number;
};

function chunk<T>(items: T[], size: number) {
	const chunks: T[][] = [];

	for (let index = 0; index < items.length; index += size) {
		chunks.push(items.slice(index, index + size));
	}

	return chunks;
}

function getMetadata(index: number) {
	const isTask = index % 5 === 0;

	if (!isTask) {
		return {
			type: "paragraph" as const,
			expanded: index % 3 === 0,
		};
	}

	return {
		type: "task" as const,
		taskCompleted: index % 2 === 0,
		expanded: index % 3 === 0,
	};
}

function getMockContent(
	index: number,
	depth: number,
	metadataType: NewNode["metadata"]["type"],
) {
	if (metadataType === "task") {
		return faker.helpers.arrayElement([
			faker.hacker.phrase(),
			faker.company.catchPhrase(),
			faker.lorem.sentence({
				min: 8,
				max: 260,
			}),
		]);
	}

	if (depth > 24 && Math.random() < 0.6) {
		return faker.lorem.sentence();
	}

	if (index % 11 === 0) {
		return faker.lorem.paragraph();
	}

	return faker.lorem.sentences({ min: 1, max: 2 });
}

function pickDeepParentId(nodesByDepth: NodeRef[]) {
	let best = nodesByDepth[Math.floor(Math.random() * nodesByDepth.length)];

	for (let index = 1; index < DEPTH_TOURNAMENT_SIZE; index += 1) {
		const contender =
			nodesByDepth[Math.floor(Math.random() * nodesByDepth.length)];

		if (
			contender.depth > best.depth ||
			(contender.depth === best.depth && Math.random() > 0.5)
		) {
			best = contender;
		}
	}

	return best.id;
}

async function insertInBatches(
	items: NewNode[],
	db: typeof import("@/db")["db"],
	nodes: typeof import("@/db/schemas/node-schema")["nodes"],
) {
	const batches = chunk(items, BATCH_SIZE);

	for (const batch of batches) {
		await db.insert(nodes).values(batch);
	}
}

async function main() {
	loadEnv({ path: resolve(process.cwd(), ".env.local") });
	loadEnv({ path: resolve(process.cwd(), ".env") });

	const { db } = await import("@/db");
	const { nodes } = await import("@/db/schemas/node-schema");

	console.info("Seeding nodes table...");
	faker.seed(FAKER_SEED);

	const items: NewNode[] = [];
	const nodesByDepth: NodeRef[] = [];
	const depthById = new Map<string, number>();
	const lastSiblingPositionByParent = new Map<string, string>();

	let previousNodeId: string | null = null;
	let rootCount = 0;
	let deepestDepth = 0;

	for (let index = 0; index < TOTAL_ITEMS; index += 1) {
		let parentId: string | null = null;

		if (index >= MIN_INITIAL_ROOTS) {
			const createRoot = Math.random() < ROOT_PROBABILITY;

			if (!createRoot) {
				const shouldChainFromPrevious =
					previousNodeId !== null && Math.random() < CHAIN_PROBABILITY;

				parentId = shouldChainFromPrevious
					? previousNodeId
					: pickDeepParentId(nodesByDepth);
			}
		}

		if (parentId === null) {
			rootCount += 1;
		}

		const parentDepth = parentId ? (depthById.get(parentId) ?? 0) : -1;
		const depth = parentDepth + 1;
		deepestDepth = Math.max(deepestDepth, depth);

		const nodeId = crypto.randomUUID();
		const metadata = getMetadata(index);
		const siblingGroupKey = parentId ?? "__root__";
		const previousSiblingPosition =
			lastSiblingPositionByParent.get(siblingGroupKey) ?? null;
		const position = generatePositionBetween(previousSiblingPosition, null);
		lastSiblingPositionByParent.set(siblingGroupKey, position);

		items.push({
			id: nodeId,
			content: getMockContent(index, depth, metadata.type),
			parentId,
			position,
			metadata,
		});

		nodesByDepth.push({
			id: nodeId,
			depth,
		});

		depthById.set(nodeId, depth);
		previousNodeId = nodeId;
	}

	const childrenCount = TOTAL_ITEMS - rootCount;

	await db.delete(nodes);
	await insertInBatches(items, db, nodes);

	console.info(
		`Seed complete: inserted ${rootCount} roots and ${childrenCount} children (${TOTAL_ITEMS} total), deepest level ${deepestDepth}.`,
	);
}

main().catch((error) => {
	console.error("Seed failed:", error);
	process.exitCode = 1;
});
