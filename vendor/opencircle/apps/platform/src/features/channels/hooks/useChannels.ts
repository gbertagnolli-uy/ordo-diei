import { useQuery } from "@tanstack/react-query";
import { api } from "../../../utils/api";

export const useChannels = () => {
	const { data, isLoading } = useQuery({
		initialData: [],
		queryKey: ["channels"],
		queryFn: async () => {
			const response = await api.channels.getAll();
			return response;
		},
	});

	return {
		channels: data,
		isChannelsLoading: isLoading,
	};
};
