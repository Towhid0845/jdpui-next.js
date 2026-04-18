import { apiClient } from '../jdpClient';

export type SellerService = {
	ServiceId?: number;
	Title?: string;
	Description?: string;
	Price?: number;
	Currency?: string;
	IsPrivate?: boolean;
	Rating?: number;
	ReviewCount?: number;
	[key: string]: unknown;
};

export type ServiceOrder = {
	OrderId?: number;
	ServiceTitle?: string;
	BuyerName?: string;
	SellerName?: string;
	Status?: string;
	Price?: number;
	Currency?: string;
	Created?: string;
	[key: string]: unknown;
};

export async function getAllSellerServices(searchText = ''): Promise<SellerService[]> {
	return apiClient.get(`api/Seller/GetAllSellerServices?searchString=${searchText}`).json<SellerService[]>();
}

export async function addSellerService(payload: Record<string, unknown>): Promise<unknown> {
	return apiClient.post('api/Seller/AddNewSellerService', { json: payload }).json<unknown>();
}

export async function updateSellerService(payload: Record<string, unknown>): Promise<unknown> {
	return apiClient.post('api/Seller/UpdateSellerService', { json: payload }).json<unknown>();
}

export async function deleteSellerService(serviceId: number): Promise<unknown> {
	return apiClient.delete(`api/Seller/DeleteSellerService/${serviceId}`).json<unknown>();
}

export async function getPublicSellerServices(params: {
	minPrice?: number;
	maxPrice?: number;
	location?: string;
	searchString?: string;
}): Promise<SellerService[]> {
	const { minPrice = 0, maxPrice = 999999, location = '', searchString = '' } = params;
	return apiClient
		.get(
			`api/Seller/GetPublicSellerServices?minPrice=${minPrice}&maxPrice=${maxPrice}&location=${location}&searchString=${searchString}`
		)
		.json<SellerService[]>();
}

export async function getSellerOrders(filter: string): Promise<ServiceOrder[]> {
	return apiClient.get(`api/Seller/GetSellerServiceOrders/${filter}`).json<ServiceOrder[]>();
}

export async function getRecruiterOrders(filter: string): Promise<ServiceOrder[]> {
	return apiClient.get(`api/Seller/GetRecruiterServiceOrders/${filter}`).json<ServiceOrder[]>();
}

export async function placeServiceOrder(payload: Record<string, unknown>): Promise<unknown> {
	return apiClient.post('api/Seller/PlaceServiceOrder', { json: payload }).json<unknown>();
}

export async function makeServicePrivate(serviceId: number, isPrivate: boolean): Promise<unknown> {
	return apiClient.get(`api/Seller/MakeServicePrivate/${serviceId}/${isPrivate}`).json<unknown>();
}
