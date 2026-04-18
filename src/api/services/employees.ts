import { apiClient } from '../jdpClient';

export type EmployeeItem = {
	EmployeeId?: number;
	FirstName?: string;
	LastName?: string;
	Email?: string;
	Phone?: string;
	Position?: string;
	Department?: string;
	IsActive?: boolean;
	JoiningDate?: string;
	[key: string]: unknown;
};

export type AttendanceItem = {
	AttendId?: number;
	EmployeeId?: number;
	Date?: string;
	InTime?: string;
	OutTime?: string;
	Status?: string;
	[key: string]: unknown;
};

export type NoticeItem = {
	NoticeId?: number;
	Title?: string;
	Description?: string;
	Created?: string;
	[key: string]: unknown;
};

export async function getEmployees(pageNumber = 1, pageSize = 10, searchText = ''): Promise<unknown> {
	return apiClient
		.get(`api/Employee/GetEmployees?page=${pageNumber}&pageSize=${pageSize}&text=${searchText}`)
		.json<unknown>();
}

export async function getEmployee(id: number): Promise<EmployeeItem> {
	return apiClient.get(`api/Employee/GetEmployee?empId=${id}`).json<EmployeeItem>();
}

export async function addEmployee(payload: Record<string, unknown>): Promise<unknown> {
	return apiClient.post('api/Employee/AddNewEmployee', { json: payload }).json<unknown>();
}

export async function updateEmployee(payload: Record<string, unknown>): Promise<unknown> {
	return apiClient.post('api/Employee/UpdateEmployee', { json: payload }).json<unknown>();
}

export async function deleteEmployee(id: number): Promise<unknown> {
	return apiClient.delete(`api/Employee/DeleteEmployee?empId=${id}`).json<unknown>();
}

export async function giveAttendance(payload: Record<string, unknown>): Promise<unknown> {
	return apiClient.post('api/Employee/GiveAttendance', { json: payload }).json<unknown>();
}

export async function getAttendances(payload: Record<string, unknown>): Promise<unknown> {
	return apiClient.post('api/Employee/GetAttendances', { json: payload }).json<unknown>();
}

export async function getAttendancesOverview(payload: Record<string, unknown>): Promise<unknown> {
	return apiClient.post('api/Employee/GetAttendancesOverview', { json: payload }).json<unknown>();
}

export async function getNotices(page = 1, pageSize = 10): Promise<unknown> {
	return apiClient.get(`api/Employee/GetNotices?page=${page}&pageSize=${pageSize}`).json<unknown>();
}

export async function createNotice(payload: Record<string, unknown>): Promise<unknown> {
	return apiClient.post('api/Employee/CreateNotice', { json: payload }).json<unknown>();
}

export async function deleteNotice(noticeId: number): Promise<unknown> {
	return apiClient.delete(`api/Employee/DeleteNotice?noticeId=${noticeId}`).json<unknown>();
}

export async function getOfficeSettings(): Promise<unknown> {
	return apiClient.get('api/Employee/GetOfficeSettings').json<unknown>();
}
