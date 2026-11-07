import { useQuery } from "@tanstack/react-query";
import { api } from "../../../utils/api";

export const useArticles = () => {
	const { data, isLoading } = useQuery({
		queryKey: ["articles"],
		queryFn: async () => {
			const response = await api.articles.getAll();
			return response;
		},
	});

	return {
		articles: data || [],
		error: null,
		isLoading,
	};
};
