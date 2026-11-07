import { useMutation } from "@tanstack/react-query";
import { HTTPError } from "ky";
import { useState } from "react";
import toast from "react-hot-toast";
import { z } from "zod";
import { api } from "../../../utils/api";

export const confirmResetPasswordSchema = z
	.object({
		code: z
			.string()
			.min(6, "Reset code must be 6 letters")
			.max(6, "Reset code must be 6 letters"),
		newPassword: z.string().min(8, "Password must be at least 8 characters"),
		confirmPassword: z
			.string()
			.min(8, "Password must be at least 8 characters"),
	})
	.refine((data) => data.newPassword === data.confirmPassword, {
		message: "Passwords don't match",
		path: ["confirmPassword"],
	});

export type ConfirmResetPasswordFormData = z.infer<
	typeof confirmResetPasswordSchema
>;

export const useConfirmResetPassword = () => {
	const [code, setCode] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [validationErrors, setValidationErrors] = useState<
		Record<string, string>
	>({});

	const {
		mutate: confirmResetPassword,
		isPending,
		isError,
		error,
	} = useMutation({
		mutationKey: ["confirmResetPassword"],
		mutationFn: async () => {
			const result = confirmResetPasswordSchema.safeParse({
				code,
				newPassword,
				confirmPassword,
			});
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
			const res = await api.auth.confirmResetPassword({
				code: code.toUpperCase(),
				new_password: newPassword,
			});
			return res;
		},
		onSuccess: (data) => {
			toast.success(data.message);
			// Redirect to login page after successful password reset
			window.location.href = "/login";
		},
		onError: (error) => {
			if (error instanceof HTTPError && error.response.status === 400) {
				toast.error(
					"Invalid or expired reset code. Please check your email for the latest code or request a new one.",
				);
			} else {
				toast.error("Failed to reset password");
			}
		},
	});

	return {
		code,
		setCode,
		newPassword,
		setNewPassword,
		confirmPassword,
		setConfirmPassword,
		confirmResetPassword,
		isPending,
		isError,
		error,
		validationErrors,
	};
};
