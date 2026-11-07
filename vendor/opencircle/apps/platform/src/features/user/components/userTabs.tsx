import type { Post } from "@opencircle/core";
import type {
	FetchNextPageOptions,
	InfiniteQueryObserverResult,
} from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { PostCard } from "../../posts/components/postCard";

interface UserTabsProps {
	posts: Post[];
	fetchNextPage: (
		options?: FetchNextPageOptions,
	) => Promise<InfiniteQueryObserverResult>;
	hasNextPage: boolean;
	isFetchingNextPage: boolean;
}

// TODO: Should be switch to ServerSide.
export const UserTabs = ({
	posts,
	fetchNextPage,
	hasNextPage,
	isFetchingNextPage,
}: UserTabsProps) => {
	const [activeTab, setActiveTab] = useState("posts");
	const userPosts = posts.filter((post) => post.type === "post");
	const userReplies = posts.filter((post) => post.type === "comment");
	const postsObserverTarget = useRef<HTMLDivElement>(null);
	const repliesObserverTarget = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const currentTarget =
			activeTab === "posts"
				? postsObserverTarget.current
				: repliesObserverTarget.current;

		if (!currentTarget) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
					fetchNextPage();
				}
			},
			{ threshold: 1.0 },
		);

		observer.observe(currentTarget);

		return () => {
			observer.unobserve(currentTarget);
		};
	}, [activeTab, fetchNextPage, hasNextPage, isFetchingNextPage]);

	return (
		<main>
			<section className="flex justify-center gap-8 border-border border-y p-4">
				<div
					onClick={() => setActiveTab("posts")}
					className={`cursor-pointer transition duration-75 hover:text-primary/50 ${
						activeTab === "posts" ? "text-primary" : ""
					}`}
				>
					Posts
				</div>
				<div
					onClick={() => setActiveTab("replies")}
					className={`cursor-pointer transition duration-75 hover:text-primary/50 ${
						activeTab === "replies" ? "text-primary" : ""
					}`}
				>
					Replies
				</div>
			</section>
			{activeTab === "posts" && (
				<section>
					{userPosts.map((post) => (
						<PostCard key={post.id} post={post} />
					))}
					{hasNextPage && (
						<div ref={postsObserverTarget} className="p-4 text-center">
							{isFetchingNextPage ? (
								<div className="text-muted-foreground text-sm">
									Loading more...
								</div>
							) : (
								<div className="h-4" />
							)}
						</div>
					)}
				</section>
			)}
			{activeTab === "replies" && (
				<section>
					{userReplies.map((post) => (
						<PostCard key={post.id} post={post} />
					))}
					{hasNextPage && (
						<div ref={repliesObserverTarget} className="p-4 text-center">
							{isFetchingNextPage ? (
								<div className="text-muted-foreground text-sm">
									Loading more...
								</div>
							) : (
								<div className="h-4" />
							)}
						</div>
					)}
				</section>
			)}
		</main>
	);
};
