import { createFileRoute, useSearch } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { z } from "zod";
import { Header } from "../../components/header";
import { METADATA } from "../../constants/metadata";
import { ModeTabs } from "../../features/posts/components/modeTabs";
import { PostForm } from "../../features/posts/components/postForm";
import { ResourcesList } from "../../features/resources/components/resourcesList";
import { PostsList } from "../../features/timeline/components/postsList";

const searchSchema = z.object({
	channel: z.string().optional(),
	mode: z.enum(["posts", "resources"]).optional().default("posts"),
});

export const Route = createFileRoute("/_socialLayout/")({
	validateSearch: zodValidator(searchSchema),
	head: () => ({
		meta: [
			{
				title: "Timeline - OpenCircle",
			},
			{
				name: "description",
				content:
					"Connect with creators and explore amazing content on OpenCircle",
			},
			{
				property: "og:title",
				content: "Timeline - OpenCircle",
			},
			{
				property: "og:description",
				content:
					"Connect with creators and explore amazing content on OpenCircle",
			},
			{
				property: "og:image",
				content: METADATA.ogImage,
			},
		],
		links: [
			{
				rel: "icon",
				href: METADATA.favicon,
			},
		],
	}),
	component: Index,
});

function Index() {
	const search = useSearch({ from: "/_socialLayout/" }) as {
		channel?: string;
		mode?: "posts" | "resources";
	};
	const mode = search?.mode || "posts";

	return (
		<>
			<Header label="Timeline" />
			<main>
				<PostForm />
				<ModeTabs />
				{mode === "posts" ? (
					<PostsList />
				) : (
					<ResourcesList channelId={search?.channel} />
				)}
			</main>
		</>
	);
}
