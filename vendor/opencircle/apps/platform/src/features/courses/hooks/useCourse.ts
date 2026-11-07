import { useQuery } from "@tanstack/react-query";
import { api } from "../../../utils/api";

export const useCourse = (courseId: string) => {
	const { data, isLoading } = useQuery({
		queryKey: ["course", courseId],
		queryFn: async () => {
			const response = await api.courses.getCourseById(courseId);
			return response;
		},
		enabled: !!courseId,
	});

	return {
		course: data,
		error: null,
		isLoading,
	};
};
