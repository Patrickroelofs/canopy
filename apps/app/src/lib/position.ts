import { generateKeyBetween } from "fractional-indexing";

type OrderedNode = {
	id: string;
	position: string;
	createdAt: Date | null;
};

export function positionValue(position: string) {
	return position.trim();
}

export function compareNodesByPosition<T extends OrderedNode>(
	left: T,
	right: T,
) {
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

	return left.id.localeCompare(right.id);
}

export function generatePositionBetween(before: string, after: string) {
	const left = positionValue(before);
	const right = positionValue(after);

	return generateKeyBetween(left, right);
}
