import { apiClient } from '../jdpClient';

export type MonthlyCount = {
	Month: number;
	Count: number;
};

export type WeeklyStats = {
	WeeklyApplicants?: Record<string, number>;
	WeeklySell?: Record<string, number>;
	GrowthRate?: number;
	LastTotalCount?: number;
};

export type DashboardViewsResponse = {
	ProfileViews?: Record<string, MonthlyCount[]>;
	VacancyViews?: Record<string, MonthlyCount[]>;
};

export type DashboardVacancyDataResponse = {
	TopVacancies?: Array<Record<string, unknown>>;
	RecentApplicants?: Array<Record<string, unknown>>;
	ApplicantStatistics?: WeeklyStats;
	VacancyStatistics?: WeeklyStats;
};

export type DashboardCandidatesProfilesResponse = {
	LatestCandidates?: Array<Record<string, unknown>>;
	MostViewdProfiles?: Array<Record<string, unknown>>;
	MostViewedProfiles?: Array<Record<string, unknown>>;
};

export type DashboardPlacementSoldResponse = {
	PlacedAplicantStatistics?: WeeklyStats;
	SoldProfileStatistics?: WeeklyStats;
};

export type DashboardVacancyChartResponse = {
	TotalVacancies?: number;
	OpenVacPercent?: number;
	ShortListPercent?: number;
	TotalApplicants?: number;
	[key: string]: unknown;
};

export type DashboardCandidateChartResponse = {
	TotalCandidates?: number;
	AvailableCandidates?: number;
	AvailableCandidatesPercentage?: number;
	NewCandidates?: number;
	NewCandidatesPercentage?: number;
	LookingForCount?: number;
	LookingForPercentage?: number;
	OccupiedCount?: number;
	OpenToRequestCount?: number;
	[key: string]: unknown;
};

export type DashboardUserConsumptionResponse = {
	TotalStorage?: number;
	UsedStorage?: number;
	AvailableStorage?: number;
	FullLimit?: number;
	UsedBasic?: number;
	UsedFull?: number;
	[key: string]: unknown;
};

export type DashboardSalesStatisticsResponse = {
	ThisYearView?: Record<string, MonthlyCount[]>;
	[key: string]: unknown;
};

export type DashboardPendingCandidate = Record<string, unknown>;

export const getDashboardViews = async (): Promise<DashboardViewsResponse> => {
	return apiClient.get('api/Dashboard/Views').json<DashboardViewsResponse>();
};

export const getDashboardVacancyData = async (): Promise<DashboardVacancyDataResponse> => {
	return apiClient.get('api/Dashboard/VacancyData').json<DashboardVacancyDataResponse>();
};

export const getDashboardCandidatesAndProfiles = async (): Promise<DashboardCandidatesProfilesResponse> => {
	return apiClient.get('api/Dashboard/CandidatesAndProfiles').json<DashboardCandidatesProfilesResponse>();
};

export const getDashboardPendingBuyCandidateList = async (): Promise<DashboardPendingCandidate[]> => {
	return apiClient.get('api/Dashboard/PendingBuyCandidateList').json<DashboardPendingCandidate[]>();
};

export const getDashboardPlacementAndSoldProfiles = async (): Promise<DashboardPlacementSoldResponse> => {
	return apiClient.get('api/Dashboard/PlacementAndSoldProfiles').json<DashboardPlacementSoldResponse>();
};

export const getDashboardSalesStatistics = async (): Promise<DashboardSalesStatisticsResponse> => {
	return apiClient.get('api/Dashboard/SalesStatistics').json<DashboardSalesStatisticsResponse>();
};

export const getDashboardUserConsumption = async (): Promise<DashboardUserConsumptionResponse> => {
	return apiClient.get('api/Dashboard/GetUserConsumption').json<DashboardUserConsumptionResponse>();
};

export const getDashboardVacancyChart = async (): Promise<DashboardVacancyChartResponse> => {
	return apiClient.get('api/VacancyChart/GetChartVacancyManager').json<DashboardVacancyChartResponse>();
};

export const getDashboardCandidateChart = async (): Promise<DashboardCandidateChartResponse> => {
	return apiClient.get('api/BasicChartsForRecruiter/').json<DashboardCandidateChartResponse>();
};

export const getDashboardBsOpporChart = async (): Promise<DashboardViewsResponse> => {
	return apiClient.get('api/Dashboard/GetBsOpporChart').json<DashboardViewsResponse>();
};

export const getBasicChartForSearch = async (): Promise<DashboardCandidateChartResponse> => {
	return apiClient.get('api/BasicChartsForSearch/').json<DashboardCandidateChartResponse>();
};