import { useQuery } from "@tanstack/react-query";
import { api } from "../../../utils/api";

export const useAppSettings = () => {
	const { data, isLoading, isError, error } = useQuery({
		queryKey: ["appSettings"],
		queryFn: async () => {
			const response = await api.appSettings.getSettings();
			return response;
		},
	});

	return {
		appSettings: data,
		isAppSettingsLoading: isLoading,
		isAppSettingsError: isError,
		appSettingsError: error,
	};
};
