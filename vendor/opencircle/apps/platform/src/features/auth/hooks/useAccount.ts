import { useQuery } from "@tanstack/react-query";
import { HTTPError } from "ky";
import { api } from "../../../utils/api";

export const useAccount = () => {
	const { data, isLoading, isError, error } = useQuery({
		enabled: localStorage.getItem("token") !== null,
		queryKey: ["account"],
		queryFn: async () => {
			const response = await api.account.getAccount();
			return response;
		},
		retry: (failureCount, error) => {
			if (error instanceof HTTPError && error.response.status === 401) {
				return false;
			}
			return failureCount < 3;
		},
	});

	return {
		account: data,
		isAccountLoading: isLoading,
		isAccountError: isError,
		accountError: error,
	};
};
