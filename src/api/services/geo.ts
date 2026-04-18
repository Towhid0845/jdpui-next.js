import { apiClient } from '../jdpClient';

export type GeoLocationResponse = {
	IpObject?: {
		query?: string;
		countryCode?: string;
		region?: string;
		langCode?: string;
	};
	country?: string;
};

export async function getGeoLocation(): Promise<GeoLocationResponse | null> {
	const token = process.env.JDP_HEADER_TOKEN;

	try {
		return await apiClient
			.get('api/HomeApp/jdp/mepi/false', {
				headers: token ? { token } : undefined
			})
			.json<GeoLocationResponse>();
	} catch {
		return null;
	}
}
