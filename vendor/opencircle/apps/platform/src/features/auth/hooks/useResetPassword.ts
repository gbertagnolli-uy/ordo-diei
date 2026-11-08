import { useMutation } from "@tanstack/react-query";
import { HTTPError } from "ky";
import { useState } from "react";
import toast from "react-hot-toast";
import { z } from "zod";
import { api } from "../../../utils/api";

export const resetPasswordSchema = z.object({
	email: z.string().min(1, "Email is required").email("Invalid email address"),
});

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export const useResetPassword = () => {
	const [email, setEmail] = useState("");
	const [validationErrors, setValidationErrors] = useState<
		Record<string, string>
	>({});

	const {
		mutate: resetPassword,
		isPending,
		isError,
		error,
	} = useMutation({
		mutationKey: ["resetPassword"],
		mutationFn: async () => {
			const result = resetPasswordSchema.safeParse({ email });
			if (!result.success) {
				const errors: Record<string, string> = {};
				result.error.issues.forEach((issue) => {
					const field = issue.path[0] as string;
					errors[field] = issue.message;
				});
				setValidationErrors(errors);
				throw new Error("Validation failed");
			}
			setValidationErrors({});
			const res = await api.auth.resetPassword({ email });
			return res;
		},
		onSuccess: (data) => {
			toast.success(data.message);
			// Redirect to confirm reset password page
			window.location.href = "/reset-password-confirm";
		},
		onError: (error) => {
			if (error instanceof HTTPError && error.response.status === 404) {
				toast.error("Email not found");
			} else {
				toast.error("Failed to send reset email");
			}
		},
	});

	return {
		email,
		setEmail,
		resetPassword,
		isPending,
		isError,
		error,
		validationErrors,
	};
};
