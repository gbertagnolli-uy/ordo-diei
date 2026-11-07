import {
	useInfiniteQuery,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import { HTTPError } from "ky";
import { api } from "../../../utils/api";

export const useNotifications = (limit: number = 20) => {
	const {
		data,
		isLoading,
		isError,
		error,
		refetch,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = useInfiniteQuery({
		enabled: localStorage.getItem("token") !== null,
		queryKey: ["notifications"],
		queryFn: async ({ pageParam = 0 }) => {
			const response = await api.notifications.getAll(pageParam, limit);
			return response;
		},
		getNextPageParam: (lastPage, allPages) => {
			if (lastPage.length < limit) {
				return undefined;
			}
			return allPages.length * limit;
		},
		initialPageParam: 0,
		retry: (failureCount, error) => {
			if (error instanceof HTTPError && error.response.status === 401) {
				return false;
			}
			return failureCount < 3;
		},
	});

	// Flatten all pages into a single array of notifications
	// useInfiniteQuery returns data.pages as an array of arrays (one array per page)
	const notifications = data?.pages.flat() || [];

	return {
		notifications,
		isNotificationsLoading: isLoading,
		isNotificationsError: isError,
		notificationsError: error,
		refetchNotifications: refetch,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	};
};

export const useMarkNotificationAsRead = () => {
	const queryClient = useQueryClient();

	const { mutate, isPending, isError, error } = useMutation({
		mutationFn: async (notificationId: string) => {
			const response = await api.notifications.markAsRead(notificationId);
			return response;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["notifications"] });
		},
		retry: (failureCount, error) => {
			if (error instanceof HTTPError && error.response.status === 401) {
				return false;
			}
			return failureCount < 3;
		},
	});

	return {
		markAsRead: mutate,
		isMarkingAsRead: isPending,
		isMarkAsReadError: isError,
		markAsReadError: error,
	};
};
