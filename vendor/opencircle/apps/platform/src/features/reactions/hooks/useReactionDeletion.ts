import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../utils/api";

export const useReactionDeletion = () => {
	const queryClient = useQueryClient();

	const { mutate: deleteReaction, isPending } = useMutation({
		mutationFn: async ({
			postId,
			emoji,
		}: {
			postId: string;
			emoji: string;
		}): Promise<{ message: string }> => {
			const response = await api.reactions.delete(postId, emoji);
			return response;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["posts"] });
		},
	});

	return {
		deleteReaction,
		isDeleting: isPending,
	};
};
