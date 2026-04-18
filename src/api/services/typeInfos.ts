import { apiClient } from '../jdpClient';

export type TypeInfoItem = {
	Value: number;
	ValueText: string;
	Name?: string;
	Type?: string;
	Order?: number;
};

export type TypeInfoResponse = {
	Result?: TypeInfoItem[] | Record<string, TypeInfoItem[]>;
};

export type TypeInfoListResponse = {
	Result?: TypeInfoItem[];
};

export async function getTypeInfosInit(lang: string, types: string[]): Promise<TypeInfoResponse> {
	return apiClient
		.post('api/TypeInfos/GetTypeList', {
			json: {
				Lang: lang,
				Types: types
			}
		})
		.json<TypeInfoResponse>();
}

export async function getTypeInfosList(lang: string): Promise<TypeInfoListResponse> {
	return apiClient.get(`api/TypeInfos/List/${lang}`).json<TypeInfoListResponse>();
}
