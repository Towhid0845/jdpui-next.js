import { apiClient } from '../jdpClient';

export async function deleteUserByEmail(email: string): Promise<unknown> {
	return apiClient.get(`api/Admins/DeleteUserByEmail/${email}`).json<unknown>();
}

export async function deleteUserByPhone(phone: string): Promise<unknown> {
	return apiClient.get(`api/Admins/DeleteUserByPhone/${phone}`).json<unknown>();
}

export async function assignRole(payload: Record<string, unknown>): Promise<unknown> {
	return apiClient.post('api/Admins/AssignRole', { json: payload }).json<unknown>();
}

export async function deleteRole(payload: Record<string, unknown>): Promise<unknown> {
	return apiClient.post('api/Admins/DeleteRole', { json: payload }).json<unknown>();
}

export async function confirmEmail(email: string): Promise<unknown> {
	return apiClient.post(`api/Admins/ConfirmEmail/${email}`, { json: {} }).json<unknown>();
}

export async function getJobdeskCultureForSettings(params: {
	langCode: string;
	pageSize?: number;
	page?: number;
	searchText?: string;
	onReview?: boolean;
	notCompleted?: boolean;
	notTranslated?: boolean;
	searchIn?: string;
}): Promise<unknown> {
	const {
		langCode,
		pageSize = 20,
		page = 1,
		searchText = '',
		onReview = false,
		notCompleted = false,
		notTranslated = false,
		searchIn = ''
	} = params;
	return apiClient
		.get(
			`api/Admins/GetJobdeskCultureForSettings/${langCode}?pageSize=${pageSize}&page=${page}&text=${searchText}&onReview=${onReview}&notComplete=${notCompleted}&notTranslated=${notTranslated}&searchIn=${searchIn}`
		)
		.json<unknown>();
}

export async function updateJobdeskLabel(payload: Record<string, unknown>): Promise<unknown> {
	return apiClient.post('api/Admins/UpdateJobdeskLabel', { json: payload }).json<unknown>();
}

export async function translateJobdeskCulture(payload: Record<string, unknown>): Promise<unknown> {
	return apiClient.post('api/Admins/TranslateJobdeskCulture', { json: payload }).json<unknown>();
}

export async function deleteJobdeskCulture(payload: Record<string, unknown>): Promise<unknown> {
	return apiClient.post('api/Admins/DeleteJobdeskCulture', { json: payload }).json<unknown>();
}

export async function sendCustomPushNotification(payload: Record<string, unknown>): Promise<unknown> {
	return apiClient.post('api/Admins/SendCustomPushNotification', { json: payload }).json<unknown>();
}
