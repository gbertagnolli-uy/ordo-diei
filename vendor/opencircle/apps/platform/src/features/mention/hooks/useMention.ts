import { useQuery } from "@tanstack/react-query";
import { api } from "../../../utils/api";

export const useMention = (query: string) => {
	const { data, isLoading } = useQuery({
		queryKey: ["mention", { query }],
		queryFn: async () => {
			if (!query.trim()) return [];
			const response = await api.users.getAll(0, 20, query);
			return response;
		},
		enabled: query.trim().length > 0,
	});

	return {
		users: data || [],
		isLoading,
	};
};
