import { useNavigate, useSearch } from "@tanstack/react-router";

export const ModeTabs = () => {
	const navigate = useNavigate({ from: "/" });
	const search = useSearch({ from: "/_socialLayout/" }) as {
		channel?: string;
		mode?: "posts" | "resources";
	};
	const mode = search?.mode || "posts";

	const handleModeChange = (newMode: string) => {
		navigate({
			search: (prev) => ({
				...prev,
				mode: newMode as "posts" | "resources",
			}),
		});
	};

	return (
		<div className="grid grid-cols-2 divide-x divide-border border-border border-b text-center text-foreground/50 text-sm">
			<button
				type="button"
				onClick={() => handleModeChange("posts")}
				className={`p-3 transition-colors ${
					mode === "posts"
						? "bg-background-secondary text-foreground"
						: "bg-background hover:bg-background-secondary/50"
				}`}
			>
				Posts
			</button>
			<button
				type="button"
				onClick={() => handleModeChange("resources")}
				className={`p-3 transition-colors ${
					mode === "resources"
						? "bg-background-secondary text-foreground"
						: "bg-background hover:bg-background-secondary/50"
				}`}
			>
				Resources
			</button>
		</div>
	);
};
