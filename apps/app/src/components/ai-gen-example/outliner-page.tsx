import { HouseSimple } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	type KeyboardEvent,
	type ReactNode,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { Button } from "@/components/ui/button";
import { client } from "@/orpc/client";

type OutlineNode = Awaited<ReturnType<typeof client.nodeRouter.list>>[number];
type NodeMetadataInput = {
	type: "paragraph" | "task";
	taskCompleted?: boolean;
	expanded?: boolean;
};

const ROOT_PARENT = "__root__";

function positionValue(position: string) {
	return position.trim();
}

function timeValue(value: Date | null) {
	return value ? value.getTime() : 0;
}

function compareOutlineNodes(left: OutlineNode, right: OutlineNode) {
	const leftPosition = positionValue(left.position);
	const rightPosition = positionValue(right.position);

	if (leftPosition && rightPosition && leftPosition !== rightPosition) {
		return leftPosition.localeCompare(rightPosition);
	}

	if (leftPosition && !rightPosition) {
		return -1;
	}

	if (!leftPosition && rightPosition) {
		return 1;
	}

	const createdAtDiff = timeValue(left.createdAt) - timeValue(right.createdAt);
	if (createdAtDiff !== 0) {
		return createdAtDiff;
	}

	return left.id.localeCompare(right.id);
}

function parentKey(parentId: string | null) {
	return parentId ?? ROOT_PARENT;
}

function buildChildrenMap(nodes: OutlineNode[]) {
	const map = new Map<string, OutlineNode[]>();

	for (const node of nodes) {
		const key = parentKey(node.parentId ?? null);
		const existing = map.get(key);

		if (existing) {
			existing.push(node);
		} else {
			map.set(key, [node]);
		}
	}

	for (const [key, siblings] of map) {
		map.set(key, [...siblings].sort(compareOutlineNodes));
	}

	return map;
}

function flattenVisibleIds(
	roots: OutlineNode[],
	childrenMap: Map<string, OutlineNode[]>,
): string[] {
	const orderedIds: string[] = [];

	const walk = (node: OutlineNode) => {
		orderedIds.push(node.id);

		if (node.metadata?.expanded === false) {
			return;
		}

		const children = childrenMap.get(node.id) ?? [];
		for (const child of children) {
			walk(child);
		}
	};

	for (const rootNode of roots) {
		walk(rootNode);
	}

	return orderedIds;
}

interface OutlineRowProps {
	node: OutlineNode;
	depth: number;
	hasChildren: boolean;
	value: string;
	onChange: (id: string, value: string) => void;
	onBlur: (id: string, value: string) => void;
	onKeyDown: (
		event: KeyboardEvent<HTMLInputElement>,
		node: OutlineNode,
	) => void;
	onToggleExpanded: (id: string) => void;
	onZoom: (id: string) => void;
	registerInput: (id: string, element: HTMLInputElement | null) => void;
}

function OutlineRow({
	node,
	depth,
	hasChildren,
	value,
	onChange,
	onBlur,
	onKeyDown,
	onToggleExpanded,
	onZoom,
	registerInput,
}: OutlineRowProps) {
	const isExpanded = node.metadata?.expanded ?? true;

	return (
		<div
			className="group flex items-center gap-1 py-0.5"
			style={{ paddingLeft: `${depth * 18}px` }}
		>
			{hasChildren ? (
				<Button
					type="button"
					variant="ghost"
					size="icon-xs"
					onClick={() => onToggleExpanded(node.id)}
					aria-label={isExpanded ? "Collapse node" : "Expand node"}
				>
					{isExpanded ? "▾" : "▸"}
				</Button>
			) : (
				<span className="inline-flex size-5 items-center justify-center text-muted-foreground">
					•
				</span>
			)}
			<input
				ref={(element) => registerInput(node.id, element)}
				value={value}
				onChange={(event) => onChange(node.id, event.target.value)}
				onBlur={(event) => onBlur(node.id, event.target.value)}
				onKeyDown={(event) => onKeyDown(event, node)}
				className="h-7 flex-1 rounded-sm border border-transparent bg-transparent px-1 text-sm outline-none focus:border-border focus:bg-background"
				placeholder="List item"
			/>
			<Button
				type="button"
				variant="ghost"
				size="xs"
				onClick={() => onZoom(node.id)}
				className="opacity-0 transition-opacity group-hover:opacity-100"
			>
				Zoom
			</Button>
		</div>
	);
}

export function OutlinerPage() {
	const queryClient = useQueryClient();
	const [zoomId, setZoomId] = useState<string | null>(null);
	const [drafts, setDrafts] = useState<Record<string, string>>({});
	const [pendingFocusId, setPendingFocusId] = useState<string | null>(null);
	const inputRefs = useRef(new Map<string, HTMLInputElement>());

	const nodesQuery = useQuery({
		queryKey: ["nodes", "all"],
		queryFn: () => client.nodeRouter.list(),
	});

	const nodes = nodesQuery.data ?? [];
	const childrenMap = useMemo(() => buildChildrenMap(nodes), [nodes]);

	const roots = useMemo(() => {
		const key = zoomId ? zoomId : ROOT_PARENT;
		return childrenMap.get(key) ?? [];
	}, [childrenMap, zoomId]);

	const nodesById = useMemo(
		() => new Map(nodes.map((node) => [node.id, node])),
		[nodes],
	);

	const zoomTrail = useMemo(() => {
		if (!zoomId) {
			return [] as OutlineNode[];
		}

		const trail: OutlineNode[] = [];
		let currentId: string | null = zoomId;

		while (currentId) {
			const current = nodesById.get(currentId);

			if (!current) {
				break;
			}

			trail.push(current);
			currentId = current.parentId ?? null;
		}

		return trail.reverse();
	}, [zoomId, nodesById]);

	const visibleIds = useMemo(
		() => flattenVisibleIds(roots, childrenMap),
		[roots, childrenMap],
	);

	const invalidateNodes = () =>
		queryClient.invalidateQueries({
			queryKey: ["nodes"],
		});

	useEffect(() => {
		if (!pendingFocusId) {
			return;
		}

		const input = inputRefs.current.get(pendingFocusId);
		if (!input) {
			return;
		}

		input.focus();
		input.setSelectionRange(input.value.length, input.value.length);
		setPendingFocusId(null);
	}, [pendingFocusId]);

	useEffect(() => {
		setDrafts((current) => {
			const next: Record<string, string> = {};
			for (const node of nodes) {
				if (Object.hasOwn(current, node.id)) {
					next[node.id] = current[node.id];
				}
			}
			return next;
		});
	}, [nodes]);

	const createMutation = useMutation({
		mutationFn: (input: { parentId: string | null; content: string }) =>
			client.nodeRouter.create({
				content: input.content,
				parentId: input.parentId,
				position: "",
				metadata: {
					type: "paragraph",
					expanded: true,
				},
			}),
		onSuccess: (node) => {
			setPendingFocusId(node.id);
			invalidateNodes();
		},
	});

	const updateMutation = useMutation({
		mutationFn: (input: {
			id: string;
			content?: string;
			parentId?: string | null;
			position?: string;
			metadata?: NodeMetadataInput;
		}) => client.nodeRouter.update(input),
		onSuccess: () => {
			invalidateNodes();
		},
	});

	const deleteMutation = useMutation({
		mutationFn: (id: string) => client.nodeRouter.delete({ id }),
		onSuccess: () => {
			invalidateNodes();
		},
	});

	const toggleExpandedMutation = useMutation({
		mutationFn: (id: string) => {
			const node = nodesById.get(id);
			const currentExpanded = node?.metadata?.expanded ?? true;
			const nodeType = node?.metadata?.type ?? "paragraph";

			return client.nodeRouter.update({
				id,
				metadata: {
					type: nodeType,
					expanded: !currentExpanded,
				},
			});
		},
		onSuccess: () => {
			invalidateNodes();
		},
	});

	const registerInput = (id: string, element: HTMLInputElement | null) => {
		if (element) {
			inputRefs.current.set(id, element);

			if (pendingFocusId === id) {
				element.focus();
				element.setSelectionRange(element.value.length, element.value.length);
				setPendingFocusId(null);
			}

			return;
		}

		inputRefs.current.delete(id);
	};

	const valueFor = (node: OutlineNode) => drafts[node.id] ?? node.content;

	const updateDraft = (id: string, value: string) => {
		setDrafts((current) => ({
			...current,
			[id]: value,
		}));
	};

	const commitNodeContent = (id: string, nextValue: string) => {
		const node = nodesById.get(id);
		if (!node || node.content === nextValue) {
			return;
		}

		updateMutation.mutate({
			id,
			content: nextValue,
		});
	};

	const createSibling = (node: OutlineNode) => {
		createMutation.mutate({
			parentId: node.parentId ?? null,
			content: "",
		});
	};

	const deleteNodeAndFocusPrevious = (node: OutlineNode) => {
		const currentIndex = visibleIds.indexOf(node.id);
		const previousVisibleId =
			currentIndex > 0 ? visibleIds[currentIndex - 1] : null;

		if (zoomId === node.id) {
			setZoomId(node.parentId ?? null);
		}

		deleteMutation.mutate(node.id, {
			onSuccess: () => {
				setPendingFocusId(previousVisibleId);
			},
		});
	};

	const indentNode = (id: string) => {
		const node = nodesById.get(id);
		if (!node) {
			return;
		}

		const siblings = childrenMap.get(parentKey(node.parentId ?? null)) ?? [];
		const currentIndex = siblings.findIndex((sibling) => sibling.id === id);

		if (currentIndex <= 0) {
			return;
		}

		const previousSibling = siblings[currentIndex - 1];

		updateMutation.mutate({
			id,
			parentId: previousSibling.id,
		});
	};

	const outdentNode = (id: string) => {
		const node = nodesById.get(id);
		if (!node?.parentId) {
			return;
		}

		const parentNode = nodesById.get(node.parentId);

		updateMutation.mutate({
			id,
			parentId: parentNode?.parentId ?? null,
		});
	};

	const onKeyDown = (
		event: KeyboardEvent<HTMLInputElement>,
		node: OutlineNode,
	) => {
		const value = drafts[node.id] ?? node.content;

		if (event.key === "Enter") {
			event.preventDefault();
			commitNodeContent(node.id, value);
			createSibling(node);
			return;
		}

		if (event.key === "Tab") {
			event.preventDefault();
			if (event.shiftKey) {
				outdentNode(node.id);
				return;
			}

			indentNode(node.id);
			return;
		}

		if (event.key === "Backspace" && value.length === 0) {
			event.preventDefault();
			deleteNodeAndFocusPrevious(node);
		}
	};

	const renderTree = (parentId: string | null, depth: number): ReactNode => {
		const siblings = childrenMap.get(parentKey(parentId)) ?? [];

		return siblings.map((node) => {
			const children = childrenMap.get(node.id) ?? [];
			const isExpanded = node.metadata?.expanded ?? true;

			return (
				<div key={node.id}>
					<OutlineRow
						node={node}
						depth={depth}
						hasChildren={children.length > 0}
						value={valueFor(node)}
						onChange={updateDraft}
						onBlur={(id, value) => commitNodeContent(id, value)}
						onKeyDown={onKeyDown}
						onToggleExpanded={(id) => toggleExpandedMutation.mutate(id)}
						onZoom={setZoomId}
						registerInput={registerInput}
					/>
					{isExpanded ? renderTree(node.id, depth + 1) : null}
				</div>
			);
		});
	};

	return (
		<div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-8 sm:px-6">
			<div className="mb-4 flex items-center justify-between gap-2">
				<div className="flex items-center gap-2 text-sm text-muted-foreground">
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={() => setZoomId(null)}
						className="text-muted-foreground"
					>
						<HouseSimple />
						All Notes
					</Button>
					{zoomTrail.map((node) => (
						<Button
							type="button"
							key={node.id}
							variant="ghost"
							size="sm"
							onClick={() => setZoomId(node.id)}
							className="max-w-40 truncate text-muted-foreground"
						>
							{node.content || "Untitled"}
						</Button>
					))}
				</div>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() =>
						createMutation.mutate({
							parentId: zoomId,
							content: "",
						})
					}
				>
					Add Item
				</Button>
			</div>

			<div className="rounded-lg border bg-card p-3">
				{nodesQuery.isLoading ? (
					<p className="text-sm text-muted-foreground">Loading...</p>
				) : roots.length === 0 ? (
					<div className="flex flex-col items-start gap-2">
						<p className="text-sm text-muted-foreground">No items yet.</p>
						<Button
							type="button"
							variant="secondary"
							size="sm"
							onClick={() =>
								createMutation.mutate({
									parentId: zoomId,
									content: "",
								})
							}
						>
							Create first item
						</Button>
					</div>
				) : (
					renderTree(zoomId, 0)
				)}
			</div>
		</div>
	);
}
