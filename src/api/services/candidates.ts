import { apiClient } from '../jdpClient';

export type CandidateItem = {
	Cid?: number;
	FirstName?: string;
	LastName?: string;
	FullName?: string;
	Email?: string;
	Phone?: string;
	Created?: string;
	AvailabilityStatus?: number;
	AvailabilityStatusText?: string;
	IsVerified?: boolean;
	ProfileImage?: string;
	Currency?: string;
	AccountType?: number;
	Rid?: number;
	Tags?: string[];
	[key: string]: unknown;
};

export type CandidateListResponse = {
	Result?: CandidateItem[];
	Paging?: {
		TotalItems?: number;
		PageNumber?: number;
		PageSize?: number;
		TotalPages?: number;
	};
	[key: string]: unknown;
};

export type CandidateStatusItem = {
	Value?: number;
	Name?: string;
	[key: string]: unknown;
};

export async function getCandidatesList(payload: Record<string, unknown>): Promise<CandidateListResponse> {
	return apiClient.post('api/Candidates/List', { json: payload }).json<CandidateListResponse>();
}

export async function getCandidate(id: number): Promise<CandidateItem> {
	return apiClient.get(`api/Candidates/${id}`).json<CandidateItem>();
}

export async function createCandidate(payload: Record<string, unknown>): Promise<unknown> {
	return apiClient.post('api/Candidates', { json: payload }).json<unknown>();
}

export async function updateCandidate(
	cid: number,
	payload: Record<string, unknown>,
	phoneChanged = false
): Promise<unknown> {
	const url = phoneChanged ? `api/Candidates/${cid}?phoneChanged=true` : `api/Candidates/${cid}`;
	return apiClient.put(url, { json: payload }).json<unknown>();
}

export async function deleteCandidate(id: number): Promise<unknown> {
	return apiClient.delete(`api/Candidates/${id}`, {}).json<unknown>();
}

export async function getCandidateStatuses(): Promise<CandidateStatusItem[]> {
	return apiClient.get('api/Candidates/Status').json<CandidateStatusItem[]>();
}

export async function getCandidateForCandidate(): Promise<unknown> {
	return apiClient.get('api/Candidates/GetCandidateForCandidate').json<unknown>();
}

export async function inviteCandidateToOpenAccount(payload: Record<string, unknown>): Promise<unknown> {
	return apiClient.post('api/Candidates/InviteCandidateToOpenAccount', { json: payload }).json<unknown>();
}

export async function addCandidateTag(cid: number, tag: string): Promise<unknown> {
	return apiClient.post('api/Candidates/Tags/Add', { json: { Cid: cid, Tag: tag } }).json<unknown>();
}

export async function removeCandidateTag(cid: number, tag: string): Promise<unknown> {
	return apiClient.post('api/Candidates/Tags/Remove', { json: { Cid: cid, Tag: tag } }).json<unknown>();
}

export async function getCandidateLog(cid: number): Promise<unknown> {
	return apiClient.get(`api/Candidates/GetCandidateLog/${cid}`).json<unknown>();
}
