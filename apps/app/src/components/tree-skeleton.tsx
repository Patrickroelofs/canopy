import { Skeleton } from "@/components/ui/skeleton";

const skeletonRows = [
	{ depth: 0, width: "w-80", hasCaret: true },
	{ depth: 1, width: "w-64", hasCaret: true },
	{ depth: 2, width: "w-56", hasCaret: false },
	{ depth: 1, width: "w-72", hasCaret: true },
	{ depth: 2, width: "w-48", hasCaret: false },
	{ depth: 0, width: "w-96", hasCaret: true },
];

export function TreeSkeleton() {
	return (
		<div className="space-y-1">
			{skeletonRows.map((row, i) => (
				<div
					// biome-ignore lint/suspicious/noArrayIndexKey: Using index as key is acceptable here because the list is static and does not change
					key={i}
					className="flex items-center"
					style={{ paddingLeft: row.depth * 24 }}
				>
					<div className="w-4 h-4 mr-1 shrink-0">
						{row.hasCaret ? <Skeleton className="h-3 w-3 rounded-sm" /> : null}
					</div>
					<div className="group flex items-start gap-3 px-1 py-1 w-full">
						<Skeleton className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full" />
						<Skeleton className={`h-5 ${row.width} max-w-[70vw]`} />
					</div>
				</div>
			))}
		</div>
	);
}
