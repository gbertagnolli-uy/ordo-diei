import type { PostCreate, PostType } from "@opencircle/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../utils/api";

export const useReplySubmission = () => {
	const queryClient = useQueryClient();

	const { mutate: createReply, isPending } = useMutation({
		mutationFn: async (data: {
			content: string;
			userId: string;
			parentId: string;
			files?: File[];
		}) => {
			const postData: PostCreate = {
				content: data.content,
				type: "comment" as PostType,
				user_id: data.userId,
				parent_id: data.parentId,
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
		createReply,
		isSubmitting: isPending,
	};
};
