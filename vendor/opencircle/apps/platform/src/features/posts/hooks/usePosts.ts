import { useInfiniteQuery } from "@tanstack/react-query";
import { useSearch } from "@tanstack/react-router";
import { HTTPError } from "ky";
import { api } from "../../../utils/api";

interface SearchParams {
	channel?: string;
}

interface usePostsProps {
	limit?: number;
	userId?: string;
	parentId?: string;
	postType?: "post" | "comment" | "article";
	channelSlug?: string;
}

export const usePosts = (props?: usePostsProps) => {
	const search = useSearch({ strict: false }) as SearchParams;
	const channelSlug = props?.channelSlug || search?.channel;
	const limit = props?.limit || 20;

	const {
		data,
		isLoading,
		error,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = useInfiniteQuery({
		queryKey: ["posts", props, channelSlug],
		queryFn: async ({ pageParam }) => {
			const response = await api.posts.getAll(
				pageParam,
				limit,
				props?.userId,
				props?.postType,
				props?.parentId,
				channelSlug,
			);
			return response;
		},
		getNextPageParam: (lastPage, allPages) => {
			if (lastPage.length < limit) {
				return undefined;
			}
			return allPages.length * limit;
		},
		initialPageParam: 0,
		retry: (failureCount, error) => {
			if (error instanceof HTTPError && error.response.status === 403) {
				console.error("Not Eligible to access");
				return false;
			}
			return failureCount < 3;
		},
	});

	// Flatten all pages into a single array of posts
	// useInfiniteQuery returns data.pages as an array of arrays (one array per page)
	const posts = data?.pages.flat() || [];

	return {
		posts,
		isPostLoading: isLoading,
		error,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	};
};
