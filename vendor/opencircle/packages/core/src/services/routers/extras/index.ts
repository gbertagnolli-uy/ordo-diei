import { BaseRouter } from "../../../utils/baseRouter";
import type { UrlPreview } from "../../types";

export class ExtrasRouter extends BaseRouter {
	async getUrlPreview(url: string): Promise<UrlPreview> {
		return this.client.get<UrlPreview>(
			`url-preview?url=${encodeURIComponent(url)}`,
		);
	}
}
