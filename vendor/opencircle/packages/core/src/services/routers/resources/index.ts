import { BaseRouter } from "../../../utils/baseRouter";
import type { Resource, ResourceCreate, ResourceUpdate } from "../../types";

export class ResourcesRouter extends BaseRouter {
	async getAll(skip: number = 0, limit: number = 100): Promise<Resource[]> {
		return this.client.get<Resource[]>(
			`resources/?skip=${skip}&limit=${limit}`,
		);
	}

	async getById(resourceId: string): Promise<Resource> {
		return this.client.get<Resource>(`resources/${resourceId}`);
	}

	async create(data: ResourceCreate): Promise<Resource> {
		return this.client.post<Resource>("resources/", data);
	}

	async update(resourceId: string, data: ResourceUpdate): Promise<Resource> {
		return this.client.put<Resource>(`resources/${resourceId}`, data);
	}

	async delete(resourceId: string): Promise<{ message: string }> {
		return this.client.delete<{ message: string }>(`resources/${resourceId}`);
	}

	async getByUser(userId: string): Promise<Resource[]> {
		return this.client.get<Resource[]>(`users/${userId}/resources/`);
	}

	async getByChannel(channelId: string): Promise<Resource[]> {
		return this.client.get<Resource[]>(`channels/${channelId}/resources/`);
	}
}
