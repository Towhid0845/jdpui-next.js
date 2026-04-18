import { apiClient } from '../jdpClient';

export type VacancyItem = {
	VacId?: number;
	Title?: string;
	DeadLine?: string;
	Type?: string;
	TypeId?: number;
	MinSalary?: number;
	MaxSalary?: number;
	SalaryCurrency?: string;
	TotalApplicants?: number;
	MatchedProfiles?: number;
	TotalShortlist?: number;
	PublishStatus?: boolean;
	PublishedDate?: string;
	IsStarred?: boolean;
	IsArchived?: boolean;
	IsExpired?: boolean;
	SectorId?: number;
	Sector?: string;
	Location?: string;
	Description?: string;
	Rid?: number;
	JobRef?: string;
	[key: string]: unknown;
};

export type VacancyListResponse = {
	Result?: VacancyItem[];
	Paging?: {
		TotalItems?: number;
		PageNumber?: number;
		PageSize?: number;
		TotalPages?: number;
	};
	[key: string]: unknown;
};

export type ApplicantItem = {
	ApplicantId?: number;
	CandidateName?: string;
	Email?: string;
	AppliedDate?: string;
	IsShortlisted?: boolean;
	ProfileId?: number;
	CandidateId?: number;
	Status?: string;
	[key: string]: unknown;
};

export type ApplicantListResponse = {
	Result?: ApplicantItem[];
	Paging?: {
		TotalItems?: number;
		PageNumber?: number;
		PageSize?: number;
		TotalPages?: number;
	};
	[key: string]: unknown;
};

export async function getVacancies(payload: Record<string, unknown>): Promise<VacancyListResponse> {
	return apiClient.post('api/Vacancy/GetVacancies', { json: payload }).json<VacancyListResponse>();
}

export async function getVacancy(payload: Record<string, unknown>): Promise<VacancyItem> {
	return apiClient.post('api/Vacancy/GetVacancy', { json: payload }).json<VacancyItem>();
}

export async function addVacancy(payload: Record<string, unknown>): Promise<unknown> {
	return apiClient.post('api/Vacancy/AddVacancy', { json: payload }).json<unknown>();
}

export async function updateVacancy(payload: Record<string, unknown>): Promise<unknown> {
	return apiClient.post('api/Vacancy/UpdateVacancy', { json: payload }).json<unknown>();
}

export async function deleteVacancy(payload: Record<string, unknown>): Promise<unknown> {
	return apiClient.post('api/Vacancy/DeleteVacancy', { json: payload }).json<unknown>();
}

export async function copyVacancy(payload: Record<string, unknown>): Promise<unknown> {
	return apiClient.post('api/Vacancy/CopyVacancy', { json: payload }).json<unknown>();
}

export async function publishUnpublishVacancy(payload: Record<string, unknown>): Promise<unknown> {
	return apiClient.post('api/Vacancy/PublishUnpublishVacancy', { json: payload }).json<unknown>();
}

export async function archiveVacancy(vacId: number): Promise<unknown> {
	return apiClient.post(`api/Vacancy/MakeJobArchived/${vacId}`, { json: {} }).json<unknown>();
}

export async function getApplicants(payload: Record<string, unknown>): Promise<ApplicantListResponse> {
	return apiClient.post('api/Vacancy/GetApplicants', { json: payload }).json<ApplicantListResponse>();
}

export async function setShortList(payload: Record<string, unknown>): Promise<unknown> {
	return apiClient.post('api/Vacancy/SetShortList', { json: payload }).json<unknown>();
}

export async function deleteApplicant(payload: Record<string, unknown>): Promise<unknown> {
	return apiClient.post('api/Vacancy/DeleteApplicant', { json: payload }).json<unknown>();
}

export async function updateStar(payload: Record<string, unknown>): Promise<unknown> {
	return apiClient.post('api/Vacancy/UpdateStar', { json: payload }).json<unknown>();
}

export async function getAllVacancyTitles(vacId: number): Promise<unknown> {
	return apiClient.get(`api/Vacancy/GetAllVacancyTitles/${vacId}`).json<unknown>();
}

export async function getApplyUrl(jobref: string): Promise<unknown> {
	return apiClient.get(`api/Vacancy/GetApplyUrl/${jobref}`).json<unknown>();
}

export type OnlineVacancyChartResponse = {
	totalJobs?: number;
	totalJobsToday?: number;
	totalRecruiterJobs?: number;
	totalCompanyJobs?: number;
	[key: string]: unknown;
};

export async function getOnlineVacancyChart(): Promise<OnlineVacancyChartResponse> {
	return apiClient.get('api/VacancyChart/GetOnlineVacancyChart').json<OnlineVacancyChartResponse>();
}

export async function getOnlineVacancy(payload: Record<string, unknown>): Promise<unknown> {
	return apiClient.post('api/Vacancy/GetOnlineVacancy', { json: payload }).json<unknown>();
}
