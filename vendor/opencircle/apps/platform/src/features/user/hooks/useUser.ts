import { useQuery } from "@tanstack/react-query";
import { api } from "../../../utils/api";

export const useUser = (username: string) => {
	const { data, isLoading } = useQuery({
		queryKey: ["user", { username }],
		queryFn: async () => {
			const response = await api.users.getByUsername(username);
			return response;
		},
	});

	return {
		user: data,
		isUserLoading: isLoading,
	};
};
