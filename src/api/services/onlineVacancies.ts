import ky from 'ky';
import { apiClient } from '../jdpClient';

export type OnlineVacancyJob = {
	Id?: number;
	SourceVacId?: number;
	RefCode?: string;
	Rid?: number;
	Title?: string;
	CompanyName?: string;
	CompanyLogo?: string;
	JobLocation?: string;
	JobTypeText?: string;
	MinSalary?: number;
	MaxSalary?: number;
	SalaryCurrency?: string;
	IsJobdesk?: boolean;
	IsJobdeskFeatured?: boolean;
	IsGovernmentJob?: boolean;
	IsFeatured?: boolean;
	IsPro?: boolean;
	PublishedDate?: string | Date;
	ApplyLink?: string;
	JobUid?: string;
};

export type OnlineVacancyResponse = {
	Jobs?: OnlineVacancyJob[];
	Paging?: {
		TotalItems?: number;
		PageNumber?: number;
		PageSize?: number;
		TotalPages?: number;
	};
};

export type CandidateInfo = {
	Cid?: number;
	Currency?: string | null;
	AccountType?: number;
	Rid?: number;
};

export type CandidateProfile = {
	Pid: number;
	Title?: string;
};

export type CandidateProfilesResponse = {
	Result?: CandidateProfile[];
};

export type SolarJobDetail = {
	rawContent?: string | null;
	sourceURL?: string | null;
	sourceKey?: string | null;
	sourceUID?: string | null;
};

export async function getOnlineVacancies(payload: Record<string, unknown>) {
	return apiClient.post('api/Vacancy/GetOnlineVacancy', { json: payload }).json<OnlineVacancyResponse>();
}

export async function getOnlineVacancyChart() {
	return apiClient.get('api/VacancyChart/GetOnlineVacancyChart').json<unknown>();
}

export async function getCandidateForCandidate() {
	return apiClient.get('api/Candidates/GetCandidateForCandidate').json<CandidateInfo>();
}

export async function getCandidateProfiles(payload: Record<string, unknown>) {
	return apiClient.post('api/Profiles/List', { json: payload }).json<CandidateProfilesResponse>();
}

export async function getProfileTags() {
	return apiClient.get('api/Profiles/GetProfileTags').json<string[]>();
}

export async function getFavoriteJobs() {
	return apiClient.get('api/CandidateFavFollowApplies/GetFavoriteJobs').json<unknown[]>();
}

export async function saveRemoveFavJob(vacId: number) {
	return apiClient.post(`api/CandidateFavFollowApplies/SaveRemoveFavJob/${vacId}`, { json: {} }).json<number>();
}

export async function checkCandidateProfileEligible(pid: number) {
	return apiClient
		.get('api/UserSettingProgress/CheckIfCandidateProfileIsEligible', { searchParams: { pid: `${pid}` } })
		.json<number>();
}

export async function getVacancyDetail(refCode: string, rid: number, langCode: string | null = null) {
	return apiClient
		.post('api/Vacancy/GetVacancy/', {
			json: {
				RefCode: refCode,
				Rid: rid,
				LangCode: langCode
			}
		})
		.json<any>();
}

export async function applyAsCandidateUser(payload: Record<string, unknown>) {
	return apiClient.post('api/Vacancy/ApplyAsCandidateUser', { json: payload }).json<number>();
}

export async function markSolrJobAsPro(uid: string) {
	return apiClient.post(`api/Admins/MarkSolrJobAsPro/${uid}`, { json: {} }).json<unknown>();
}

export async function unmarkSolrJobAsPro(uid: string) {
	return apiClient.post(`api/Admins/UnmarkSolrJobAsPro/${uid}`, { json: {} }).json<unknown>();
}

function resolveRegion(activeOrigin?: string) {
	const origin = activeOrigin || (typeof window !== 'undefined' ? window.location.origin : '') || '';
	if (!origin) return 'sas';
	if (origin.includes('localhost') || origin.includes('cloud')) return 'sas';
	const cleaned = origin.replace('https://', '').replace('http://', '');
	const region = cleaned.split('.')[0];
	return region || 'sas';
}

export async function adminDeletePublishedVacancy(vacancy: OnlineVacancyJob) {
	const region = resolveRegion(process.env.ACTIVE_ORIGIN);
	return apiClient
		.delete('api/Admins/DeletePublishedVacancy', {
			searchParams: {
				vid: `${vacancy.Id ?? ''}`,
				sourceId: `${vacancy.SourceVacId ?? ''}`,
				refcode: vacancy.RefCode ?? '',
				rid: `${vacancy.Rid ?? ''}`,
				region
			}
		})
		.json<unknown>();
}

const solarClient = ky.create({ prefixUrl: 'https://data.jobdesk.com/api' });

export async function getSolarJobDetail(jobUid: string) {
	return solarClient.post(`GetJobAd/${jobUid}`, { json: {} }).json<SolarJobDetail>();
}

export async function adminDeleteAllJobDataBySourceKey(sourceKey: string) {
	return solarClient.post(`DeleteJobs/${sourceKey}`, { json: {} }).json<unknown>();
}

export async function adminDeleteJobData(sourceKey: string, uid: string) {
	return solarClient.post(`DeleteJob/${sourceKey}/${uid}`, { json: {} }).json<unknown>();
}
