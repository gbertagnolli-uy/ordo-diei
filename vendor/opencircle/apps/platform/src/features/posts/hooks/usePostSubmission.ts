import type { PostCreate, PostType } from "@opencircle/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../utils/api";

export const usePostSubmission = () => {
	const queryClient = useQueryClient();

	const { mutate: createPost, isPending } = useMutation({
		mutationFn: async (data: {
			content: string;
			userId: string;
			files?: File[];
			channelId?: string;
		}) => {
			const postData: PostCreate = {
				content: data.content,
				type: "post" as PostType,
				user_id: data.userId,
				channel_id: data.channelId,
			};

			if (data.files && data.files.length > 0) {
				const response = await api.posts.createWithFiles(postData, data.files);
				return response;
			} else {
				const response = await api.posts.create(postData);
				return response;
			}
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["posts"] });
		},
	});

	return {
		createPost,
		isSubmitting: isPending,
	};
};
