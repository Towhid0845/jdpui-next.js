import { apiClient } from '../jdpClient';

export type ContactItem = {
	ConId?: number;
	FirstName?: string;
	LastName?: string;
	FullName?: string;
	Email?: string;
	Phone?: string;
	Company?: string;
	Position?: string;
	Rating?: number;
	IsImportant?: boolean;
	Tags?: string[];
	Created?: string;
	Rid?: number;
	[key: string]: unknown;
};

export type ContactListResponse = {
	Result?: ContactItem[];
	Paging?: {
		TotalItems?: number;
		PageNumber?: number;
		PageSize?: number;
		TotalPages?: number;
	};
	[key: string]: unknown;
};

export async function getContactsList(payload: Record<string, unknown>): Promise<ContactListResponse> {
	return apiClient.post('api/Contacts/List', { json: payload }).json<ContactListResponse>();
}

export async function getContactById(id: number): Promise<ContactItem> {
	return apiClient.get(`api/Contacts/GetContactById/${id}`).json<ContactItem>();
}

export async function createContact(rid: number, payload: Record<string, unknown>): Promise<unknown> {
	return apiClient.post(`api/Contacts/${rid}`, { json: payload }).json<unknown>();
}

export async function updateContact(payload: Record<string, unknown>): Promise<unknown> {
	return apiClient.put('api/Contacts', { json: payload }).json<unknown>();
}

export async function deleteContact(conId: number): Promise<unknown> {
	return apiClient.delete(`api/Contacts/${conId}`).json<unknown>();
}

export async function updateContactRating(payload: Record<string, unknown>): Promise<unknown> {
	return apiClient.post('api/Contacts/UpdateRating', { json: payload }).json<unknown>();
}

export async function updateContactImportant(payload: Record<string, unknown>): Promise<unknown> {
	return apiClient.post('api/Contacts/UpdateImportant', { json: payload }).json<unknown>();
}

export async function getContactHistory(contactId: number): Promise<unknown> {
	return apiClient.get(`api/ContactHistory/${contactId}`).json<unknown>();
}

export async function addContactHistory(payload: Record<string, unknown>): Promise<unknown> {
	return apiClient.post('api/ContactHistory/', { json: payload }).json<unknown>();
}
