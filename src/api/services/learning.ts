import { apiClient } from '../jdpClient';

export type LearningResource = {
	Id?: number;
	Title?: string;
	Description?: string;
	Type?: string;
	Url?: string;
	ImageUrl?: string;
	AccountType?: number;
	Created?: string;
	[key: string]: unknown;
};

export async function getPublicResources(params: {
	acType?: number;
	text?: string;
	type?: string;
	page?: number;
	pageSize?: number;
}): Promise<unknown> {
	const { acType = 0, text = '', type = '', page = 1, pageSize = 20 } = params;
	return apiClient
		.get(
			`api/Learning/GetPublicResources?acType=${acType}&text=${text}&type=${type}&page=${page}&pageSize=${pageSize}`
		)
		.json<unknown>();
}

export async function getResources(payload: Record<string, unknown>): Promise<unknown> {
	return apiClient.post('api/Learning/GetResources', { json: payload }).json<unknown>();
}

export async function addResource(payload: Record<string, unknown>): Promise<unknown> {
	return apiClient.post('api/Learning/AddResources', { json: payload }).json<unknown>();
}

export async function updateResource(payload: Record<string, unknown>): Promise<unknown> {
	return apiClient.post('api/Learning/UpdateResources', { json: payload }).json<unknown>();
}

export async function deleteResource(id: number): Promise<unknown> {
	return apiClient.delete(`api/Learning/DeleteResources/${id}`).json<unknown>();
}
