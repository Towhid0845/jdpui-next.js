import { apiClient } from '../jdpClient';

export async function getUserInfoByEmail(
	email: string,
	accessToken?: string,
	isMobile: boolean = false
): Promise<unknown> {
	const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
	const path = isMobile ? `api/ApplicationUser/Phone/${email}` : `api/ApplicationUser/Email/${email}`;
	return apiClient.get(path, { headers }).json<unknown>();
}

export async function getUserInfoByPhone(phone: string, accessToken?: string): Promise<unknown> {
	const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
	return apiClient.get(`api/ApplicationUser/Phone/${phone}`, { headers }).json<unknown>();
}
