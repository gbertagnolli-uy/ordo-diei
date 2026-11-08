import { useMutation, useQueryClient } from "@tanstack/react-query";
import { HTTPError } from "ky";
import toast from "react-hot-toast";
import { api } from "../../../utils/api";
import { useAccount } from "../../auth/hooks/useAccount";

interface EnrollCourseContext {
	onSuccess?: () => void;
	onError?: (error: Error) => void;
}

export const useEnrollCourse = (context?: EnrollCourseContext) => {
	const queryClient = useQueryClient();
	const { account } = useAccount();

	const {
		mutate: enroll,
		isPending,
		isError,
		error,
	} = useMutation({
		mutationKey: ["enrollCourse"],
		mutationFn: async (courseId: string) => {
			if (!account?.id) {
				throw new Error("User not authenticated");
			}
			const response = await api.courses.enrollUser(account.id, courseId);
			return response;
		},
		onSuccess: (_, courseId) => {
			// Invalidate and refetch enrollment check for this course
			queryClient.invalidateQueries({
				queryKey: ["enrollment", courseId],
			});

			// Invalidate courses list to update enrollment status
			queryClient.invalidateQueries({
				queryKey: ["courses"],
			});

			toast.success("Successfully enrolled in course!");
			context?.onSuccess?.();
		},
		onError: (error) => {
			if (error instanceof HTTPError) {
				switch (error.response.status) {
					case 400:
						toast.error("Invalid course ID or already enrolled");
						break;
					case 401:
						toast.error("Please login to enroll in courses");
						break;
					case 404:
						toast.error("Course not found");
						break;
					case 409:
						toast.error("Already enrolled in this course");
						break;
					default:
						toast.error("Failed to enroll in course");
				}
			} else {
				toast.error(error.message || "An unexpected error occurred");
			}
			context?.onError?.(error);
		},
	});

	return {
		enroll,
		isPending,
		isError,
		error,
	};
};
