import type { ReactionCreate, ReactionResponse } from "@opencircle/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../utils/api";

export const useReactionSubmission = () => {
	const queryClient = useQueryClient();

	const { mutate: submitReaction, isPending } = useMutation({
		mutationFn: async (data: ReactionCreate): Promise<ReactionResponse> => {
			const response = await api.reactions.create(data);
			return response;
		},
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: ["posts"] });
			queryClient.invalidateQueries({
				queryKey: ["post", { id: variables.post_id }],
			});

			queryClient.invalidateQueries({ queryKey: ["articles"] });
			queryClient.invalidateQueries({
				queryKey: ["articles", { id: variables.post_id }],
			});
		},
	});

	return {
		submitReaction,
		isSubmitting: isPending,
	};
};
