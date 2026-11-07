import { useQuery } from "@tanstack/react-query";
import { api } from "../../../utils/api";

export const useSections = (courseId: string) => {
	const { data, isLoading, isError, error } = useQuery({
		queryKey: ["sections", courseId],
		queryFn: async () => {
			const sections = await api.courses.getAllSections(courseId);

			// Fetch lessons for each section
			const sectionsWithLessons = await Promise.all(
				sections
					.sort((a, b) => a.order - b.order)
					.map(async (section) => {
						const lessons = await api.courses.getAllLessons(section.id);
						return {
							...section,
							lessons: lessons.sort((a, b) => a.order - b.order),
						};
					}),
			);

			return sectionsWithLessons;
		},
		enabled: !!courseId,
	});

	return {
		sections: data,
		isLoading,
		isError,
		error,
	};
};
