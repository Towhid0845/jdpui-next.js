import { apiClient } from '../jdpClient';
import type { AuthLoginPayload, AuthRegisterPayload, AuthLoginResponse } from '../types/auth';

async function parseJsonOrText<T>(response: Response): Promise<T> {
	const contentType = response.headers.get('content-type') || '';
	if (contentType.includes('application/json')) {
		return response.json();
	}

	const text = await response.text();
	try {
		return JSON.parse(text) as T;
	} catch {
		return text as T;
	}
}

export async function authLogin(payload: AuthLoginPayload): Promise<AuthLoginResponse> {
	const response = await apiClient.post('api/Login', { json: payload });
	return parseJsonOrText<AuthLoginResponse>(response);
}

export async function authRegister(payload: AuthRegisterPayload): Promise<unknown> {
	const response = await apiClient.post('api/Register', { json: payload });
	return parseJsonOrText<unknown>(response);
}

export async function authForgotPassword(email: string): Promise<unknown> {
	const response = await apiClient.post('api/Register/Forget', { json: { email } });
	return parseJsonOrText<unknown>(response);
}

export async function authResetPassword(payload: Record<string, unknown>): Promise<unknown> {
	const response = await apiClient.post('api/Register/Reset', { json: payload });
	return parseJsonOrText<unknown>(response);
}
