import { apiClient } from '../jdpClient';

const OTP_TOKEN = process.env.OTP_TOKEN || 'af3da1cd1c1c4d338265d5842cb93f69';
const otpHeaders = OTP_TOKEN ? { otpToken: OTP_TOKEN } : undefined;

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

export async function updateUserProfile(payload: Record<string, unknown>, phoneChanged = false): Promise<unknown> {
	const response = await apiClient.post(`api/ApplicationUser/UpdateUserProfile?phoneChanged=${phoneChanged}`, {
		json: payload
	});
	return parseJsonOrText<unknown>(response);
}

export async function changePassword(payload: Record<string, unknown>): Promise<unknown> {
	const response = await apiClient.post('api/ApplicationUser/ChangePasword', { json: payload });
	return parseJsonOrText<unknown>(response);
}

export async function checkNumberAndSendOtp(
	number: string,
	iso2: string,
	nocheck = false
): Promise<unknown> {
	const suffix = nocheck ? '?nocheck=true' : '';
	const response = await apiClient.get(`api/OTP/CheckNumberAndSendOTP/${number}/${iso2}${suffix}`, {
		headers: otpHeaders
	});
	return parseJsonOrText<unknown>(response);
}

export async function verifyOtp(code: string, otp: string, iso2: string, phoneNumber?: string): Promise<unknown> {
	const query = phoneNumber ? `?number=${encodeURIComponent(phoneNumber)}` : '';
	const response = await apiClient.get(`api/OTP/ValidateOtp/${code}/${otp}/${iso2}${query}`);
	return parseJsonOrText<unknown>(response);
}

export async function enableOrDisable2FA(enable: boolean): Promise<unknown> {
	const response = await apiClient.post(`api/ApplicationUser/User2FaOnOff/${enable}`, { json: {} });
	return parseJsonOrText<unknown>(response);
}

export async function turnOnOffAutoProcessLead(isActive: boolean): Promise<unknown> {
	const response = await apiClient.get(`api/ApplicationUser/TurnOnOffAutoProcessLead/${isActive}`);
	return parseJsonOrText<unknown>(response);
}

export async function getAllSubUsers(): Promise<unknown> {
	const response = await apiClient.get('api/SubUser/GetAll');
	return parseJsonOrText<unknown>(response);
}

export async function createSubUser(payload: Record<string, unknown>): Promise<unknown> {
	const response = await apiClient.post('api/SubUser/Create', { json: payload });
	return parseJsonOrText<unknown>(response);
}

export async function changeSubUserType(payload: Record<string, unknown>): Promise<unknown> {
	const response = await apiClient.post('api/SubUser/ChangeSubUserType', { json: payload });
	return parseJsonOrText<unknown>(response);
}

export async function deleteSubUser(payload: Record<string, unknown>): Promise<unknown> {
	const response = await apiClient.post('api/SubUser/DeleteSubUser', { json: payload });
	return parseJsonOrText<unknown>(response);
}

export async function lockUnlockSubUser(payload: Record<string, unknown>): Promise<unknown> {
	const response = await apiClient.post('api/SubUser/LockUnlockSubUser', { json: payload });
	return parseJsonOrText<unknown>(response);
}

export async function getSupportedCultureCodes(langCode: string): Promise<unknown> {
	const response = await apiClient.get(`api/Culture/SuportedCultureCodes/${langCode}`);
	return parseJsonOrText<unknown>(response);
}

export async function verifyIdentity(payload: {
	nid: File;
	selfie: File;
	name: string;
	identityType: number;
	birthDate: string;
}): Promise<unknown> {
	const formData = new FormData();
	formData.append('NID', payload.nid, payload.nid.name);
	formData.append('Selfie', payload.selfie, payload.selfie.name);
	formData.append('Name', payload.name);
	formData.append('IdentityType', payload.identityType.toString());
	formData.append('BirthDate', payload.birthDate);

	const response = await apiClient.post('api/ApplicationUser/VerifyIdentity', {
		body: formData
	});

	return parseJsonOrText<unknown>(response);
}
