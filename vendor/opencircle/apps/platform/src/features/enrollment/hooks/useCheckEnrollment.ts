import { useQuery } from "@tanstack/react-query";
import { api } from "../../../utils/api";
import { useAccount } from "../../auth/hooks/useAccount";

export const useCheckEnrollment = (courseId: string) => {
	const { account } = useAccount();

	const { data, isLoading, error } = useQuery({
		queryKey: ["enrollment", courseId],
		queryFn: async () => {
			const response = await api.courses.getCourseEnrollments(courseId);
			return response;
		},
		enabled: !!courseId && !!account?.id,
	});

	const isEnrolled =
		account?.id &&
		data?.some((enrollment) => enrollment.user_id === account.id);

	return {
		isEnrolled: !!isEnrolled,
		enrollmentData: data,
		isLoading,
		error,
	};
};
