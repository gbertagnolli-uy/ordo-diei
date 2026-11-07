import { BaseRouter } from "../../../utils/baseRouter";
import type {
	AppSettings,
	AppSettingsCreate,
	AppSettingsUpdate,
} from "../../types";

export interface InstallationStatus {
	is_installed: boolean;
	admin_count: number;
}

export class AppSettingsRouter extends BaseRouter {
	async getSettings(): Promise<AppSettings> {
		return this.client.get<AppSettings>("appsettings/");
	}

	async createSettings(data: AppSettingsCreate): Promise<AppSettings> {
		return this.client.post<AppSettings>("appsettings/", data);
	}

	async updateSettings(data: AppSettingsUpdate): Promise<AppSettings> {
		return this.client.put<AppSettings>("appsettings/", data);
	}

	async uploadLogo(file: File): Promise<AppSettings> {
		const formData = new FormData();
		formData.append("file", file);
		return this.client.post<AppSettings>("appsettings/upload-logo", formData);
	}

	async getSettingsCount(): Promise<number> {
		return this.client.get<number>("appsettings/count");
	}

	async getInstallationStatus(): Promise<InstallationStatus> {
		return this.client.get<InstallationStatus>(
			"appsettings/installation-status",
		);
	}
}
