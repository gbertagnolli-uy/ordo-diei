import type {
	UserSocial,
	UserUpdate,
	UserUpdateWithFile,
} from "@opencircle/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { api } from "../../../utils/api";
import { useAccount } from "../../auth/hooks/useAccount";

export const useEditProfile = () => {
	const { account, isAccountLoading, isAccountError, accountError } =
		useAccount();
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [formData, setFormData] = useState<
		UserUpdateWithFile & { user_social?: UserSocial }
	>({
		name: "",
		bio: "",
		avatar_url: undefined,
		user_social: {
			twitter_url: "",
			linkedin_url: "",
			github_url: "",
			website_url: "",
		},
	});
	const [avatarFile, setAvatarFile] = useState<File | null>(null);

	useEffect(() => {
		if (account) {
			setFormData({
				name: account.name || "",
				bio: account.bio || "",
				avatar_url: account.avatar_url || undefined,
				user_social: {
					twitter_url: account.user_social?.twitter_url || "",
					linkedin_url: account.user_social?.linkedin_url || "",
					github_url: account.user_social?.github_url || "",
					website_url: account.user_social?.website_url || "",
				},
			});
		}
	}, [account]);

	const updateMutation = useMutation({
		mutationFn: async () => {
			if (account) {
				if (avatarFile) {
					const dataWithoutUrl = { ...formData, avatar_url: undefined };
					return await api.users.updateWithFile(
						account.id,
						dataWithoutUrl,
						avatarFile,
					);
				} else {
					return await api.users.update(account.id, formData as UserUpdate);
				}
			}
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["account"] });
			navigate({ to: "/" });
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		updateMutation.mutate();
	};

	const handleChange = (field: keyof UserUpdateWithFile, value: string) => {
		setFormData((prev: UserUpdateWithFile & { user_social?: UserSocial }) => ({
			...prev,
			[field]: value,
		}));
	};

	const handleSocialChange = (field: keyof UserSocial, value: string) => {
		setFormData((prev: UserUpdateWithFile & { user_social?: UserSocial }) => ({
			...prev,
			user_social: {
				...prev.user_social,
				[field]: value,
			},
		}));
	};

	const handleUpload = () => {
		fileInputRef.current?.click();
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			setAvatarFile(file);
			const reader = new FileReader();
			reader.onload = () => {
				setFormData((prev: UserUpdateWithFile) => ({
					...prev,
					avatar_url: reader.result as string,
				}));
			};
			reader.readAsDataURL(file);
		}
	};

	return {
		account,
		isAccountLoading,
		isAccountError,
		accountError,
		formData,
		avatarFile,
		updateMutation,
		fileInputRef,
		handleSubmit,
		handleChange,
		handleSocialChange,
		handleUpload,
		handleFileChange,
	};
};
