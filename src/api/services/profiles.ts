import { apiClient } from '../jdpClient';

export type ProfileSearchItem = {
	Pid?: number;
	Cid?: number;
	FullName?: string;
	FirstName?: string;
	LastName?: string;
	Title?: string;
	Skills?: string[];
	Languages?: string[];
	Location?: string;
	Country?: string;
	CountryCode?: string;
	Salary?: number;
	SalaryCurrency?: string;
	Rating?: number;
	RatingCount?: number;
	AvailabilityStatus?: number;
	AvailabilityStatusText?: string;
	AvailableFrom?: string;
	IsVerified?: boolean;
	IsFavorite?: boolean;
	ProfileImage?: string;
	Created?: string;
	LastUpdated?: string;
	AccountType?: number;
	[key: string]: unknown;
};

export type ProfileSearchResponse = {
	Result?: ProfileSearchItem[];
	Paging?: {
		TotalItems?: number;
		PageNumber?: number;
		PageSize?: number;
		TotalPages?: number;
	};
	[key: string]: unknown;
};

export type ProfileItem = {
	Pid?: number;
	Cid?: number;
	Title?: string;
	Description?: string;
	Skills?: string[];
	[key: string]: unknown;
};

export type ProfileListResponse = {
	Result?: ProfileItem[];
	Paging?: {
		TotalItems?: number;
		PageNumber?: number;
		PageSize?: number;
		TotalPages?: number;
	};
	[key: string]: unknown;
};

export async function searchProfiles(payload: Record<string, unknown>): Promise<ProfileSearchResponse> {
	return apiClient.post('api/ProfileSearch/Search', { json: payload }).json<ProfileSearchResponse>();
}

export async function getProfilesList(payload: Record<string, unknown>): Promise<ProfileListResponse> {
	return apiClient.post('api/Profiles/List', { json: payload }).json<ProfileListResponse>();
}

export async function getProfileByPid(pid: number): Promise<ProfileItem> {
	return apiClient.get(`api/Profiles/GetProfileByPid/${pid}`).json<ProfileItem>();
}

export async function addProfile(payload: Record<string, unknown>): Promise<unknown> {
	return apiClient.post('api/Profiles', { json: payload }).json<unknown>();
}

export async function updateProfile(pid: number, payload: Record<string, unknown>): Promise<unknown> {
	return apiClient.put(`api/Profiles/${pid}`, { json: payload }).json<unknown>();
}

export type PublishedProfileDetail = {
	Puid?: string;
	Pid?: number;
	Cid?: number;
	FullName?: string;
	FirstName?: string;
	LastName?: string;
	Title?: string;
	AboutText1?: string;
	Skills?: string[];
	Languages?: Record<string, unknown>[];
	Educations?: Record<string, unknown>[];
	ProfessionalExperiences?: Record<string, unknown>[];
	Certificates?: Record<string, unknown>[];
	Location?: string;
	Country?: string;
	CountryCode?: string;
	Salary?: number;
	SalaryCurrency?: string;
	Rating?: number;
	RatingCount?: number;
	AvailabilityStatus?: number;
	AvailableFrom?: string;
	AvailableInText?: string;
	IsVerified?: boolean;
	ProfileImage?: string;
	EducationText?: string;
	ExpectedSalaryText?: string;
	CertificateText?: string;
	[key: string]: unknown;
};

export async function getPublishedProfile(puid: string): Promise<PublishedProfileDetail> {
	return apiClient.get(`api/PublishedProfiles/${puid}`).json<PublishedProfileDetail>();
}

export async function getPuidByPid(pid: number): Promise<unknown> {
	return apiClient.get(`api/PublishedProfiles/GetPuidByPid/${pid}`).json<unknown>();
}
