interface EditableRegionProps {
	value: string;
}

export const EditableRegion = ({ value }: EditableRegionProps) => {
	return (
		<p
			className="min-w-0 flex-1 leading-6 text-foreground wrap-break-word text-base focus:outline-2 focus:outline-offset-4 rounded-md"
			contentEditable
			suppressContentEditableWarning
		>
			{value}
		</p>
	);
};
