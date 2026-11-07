import { useQuery } from "@tanstack/react-query";
import { api } from "../../../utils/api";

export const useArticle = (id: string) => {
	const { data, isLoading } = useQuery({
		queryKey: ["articles", { id }],
		queryFn: async () => {
			const response = await api.articles.getById(id);
			return response;
		},
	});

	return {
		article: data,
		error: null,
		isLoading,
	};
};
