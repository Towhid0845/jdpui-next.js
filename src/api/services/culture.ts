import { apiClient } from '../jdpClient';

export async function getCultureMetaDataVersion(metaDataName: string): Promise<number> {
	return apiClient.get(`api/Culture/MetaDataVersion/${metaDataName}`).json<number>();
}

export async function getCultureData(cultureCode: string): Promise<Record<string, string>> {
	return apiClient.get(`api/Culture/${cultureCode}`).json<Record<string, string>>();
}

export async function getSupportedCultureCodes(langCode: string): Promise<unknown> {
	return apiClient.get(`api/Culture/SuportedCultureCodes/${langCode}`).json<unknown>();
}
