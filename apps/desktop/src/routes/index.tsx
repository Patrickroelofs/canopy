import { createFileRoute } from "@tanstack/react-router";

export const Home: React.FC = () => {
	return (
		<div>
			<p>Hello World</p>
		</div>
	);
};

export const Route = createFileRoute("/")({
	component: Home,
});
