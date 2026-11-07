import { useQuery } from "@tanstack/react-query";
import { api } from "../../../utils/api";

export const useLessons = (sectionId: string) => {
	const { data, isLoading, isError, error } = useQuery({
		queryKey: ["lessons", sectionId],
		queryFn: async () => {
			const response = await api.courses.getAllLessons(sectionId);
			// Sort by order
			return response.sort((a, b) => a.order - b.order);
		},
		enabled: !!sectionId,
	});

	return {
		lessons: data,
		isLoading,
		isError,
		error,
	};
};
