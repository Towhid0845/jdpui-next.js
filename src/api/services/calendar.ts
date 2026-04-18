import { apiClient } from '../jdpClient';

export type CalendarEvent = {
	Id?: number;
	Title?: string;
	Description?: string;
	Start?: string;
	End?: string;
	AllDay?: boolean;
	Color?: string;
	[key: string]: unknown;
};

export async function getAllEvents(): Promise<CalendarEvent[]> {
	return apiClient.get('api/Calendar/GetAllEvents/').json<CalendarEvent[]>();
}

export async function addEvent(payload: Record<string, unknown>): Promise<unknown> {
	return apiClient.post('api/Calendar/AddNewEvent', { json: payload }).json<unknown>();
}

export async function updateEvent(payload: Record<string, unknown>): Promise<unknown> {
	return apiClient.post('api/Calendar/UpdateEvent', { json: payload }).json<unknown>();
}

export async function deleteEvent(id: number): Promise<unknown> {
	return apiClient.delete(`api/Calendar/DeleteEvent/${id}`).json<unknown>();
}
