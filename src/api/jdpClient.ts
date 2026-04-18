import ky, { KyInstance } from 'ky';

const API_BASE_URL = (process.env.API_BASE_URL || '').replace(/\/+$/, '');

type HeadersMap = Record<string, string>;

let globalHeaders: HeadersMap = {};

export const apiClient: KyInstance = ky.create({
	prefixUrl: API_BASE_URL,
	hooks: {
		beforeRequest: [
			(request) => {
				if (!API_BASE_URL) {
					throw new Error('API_BASE_URL_MISSING');
				}
				Object.entries(globalHeaders).forEach(([key, value]) => {
					request.headers.set(key, value);
				});
			}
		]
	},
	retry: {
		limit: 2,
		methods: ['get', 'put', 'head', 'delete', 'options', 'trace']
	}
});

export const setApiGlobalHeaders = (headers: HeadersMap) => {
	globalHeaders = { ...globalHeaders, ...headers };
};

export const removeApiGlobalHeaders = (headerKeys: string[]) => {
	headerKeys.forEach((key) => {
		delete globalHeaders[key];
	});
};

export const setApiAuthToken = (token?: string | null) => {
	if (!token) {
		removeApiGlobalHeaders(['Authorization']);
		return;
	}

	setApiGlobalHeaders({ Authorization: `Bearer ${token}` });
};

export const setApiLanguage = (language?: string | null) => {
	if (!language) {
		removeApiGlobalHeaders(['language']);
		return;
	}

	setApiGlobalHeaders({ language });
};

export const getApiGlobalHeaders = () => globalHeaders;

export const getApiBaseUrl = () => API_BASE_URL;
