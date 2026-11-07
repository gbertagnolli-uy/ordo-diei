import type { User } from "../auth/types";
import type { Channel } from "../channels/types";

export interface Resource {
	id: string;
	url: string;
	description?: string;
	user_id: string;
	channel_id: string;
	user: User;
	channel: Channel;
	created_at: string;
	updated_at: string;
}

export interface ResourceCreate {
	url: string;
	description?: string;
	user_id: string;
	channel_id: string;
}

export interface ResourceUpdate {
	url?: string;
	description?: string;
}
