import { useQuery } from "@tanstack/react-query";
import { api } from "../../../utils/api";

export const usePost = (id: string) => {
	const { data, isLoading } = useQuery({
		queryKey: ["post", { id }],
		queryFn: async () => {
			const response = await api.posts.getById(id);
			return response;
		},
	});

	return {
		post: data,
		isPostLoading: isLoading,
	};
};
