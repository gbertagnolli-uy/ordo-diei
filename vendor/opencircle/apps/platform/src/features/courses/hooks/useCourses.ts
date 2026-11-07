import { useQuery } from "@tanstack/react-query";
import { api } from "../../../utils/api";

export const useCourses = () => {
	const { data, isLoading } = useQuery({
		queryKey: ["courses"],
		queryFn: async () => {
			const response = await api.courses.getAllCourses();
			return response;
		},
	});

	return {
		courses: data || [],
		error: null,
		isLoading,
	};
};
