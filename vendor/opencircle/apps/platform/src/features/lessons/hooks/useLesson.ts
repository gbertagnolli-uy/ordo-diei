import { useQuery } from "@tanstack/react-query";
import { api } from "../../../utils/api";

export const useLesson = (lessonId: string) => {
	const { data, isLoading } = useQuery({
		queryKey: ["lesson", lessonId],
		queryFn: async () => {
			const response = await api.courses.getLessonById(lessonId);
			return response;
		},
		enabled: !!lessonId,
	});

	return {
		lesson: data,
		error: null,
		isLoading,
	};
};
