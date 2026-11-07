import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../utils/api";

export const usePostDelete = () => {
	const queryClient = useQueryClient();

	const { mutate: deletePost, isPending } = useMutation({
		mutationFn: async (id: string) => {
			const response = await api.posts.delete(id);
			return response;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["posts"] });
		},
	});

	return {
		deletePost,
		isDeleting: isPending,
	};
};
