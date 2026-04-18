'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { setApiLanguage } from '@/api/jdpClient';
import { getCultureData, getCultureMetaDataVersion, getSupportedCultureCodes } from '@/api/services/culture';
import { getTypeInfosInit, getTypeInfosList, TypeInfoItem } from '@/api/services/typeInfos';
import { useAuth } from '@auth/AuthProvider';

export type SupportedCulture = {
	Id?: string;
	Code?: string;
	NativeName?: string;
	LanguageId?: number;
	Title?: string;
	Flag?: string;
};

export type SystemDataContextValue = {
	typeInfos: Record<string, TypeInfoItem[]>;
	culture: Record<string, string>;
	currentCulture: string;
	supportedCultures: SupportedCulture[];
	isReady: boolean;
	isLoading: boolean;
	error: string | null;
	refreshAll: () => Promise<void>;
	refreshTypeInfos: (types?: string[]) => Promise<void>;
	setCultureCode: (code: string) => Promise<void>;
	getLabel: (key: string, fallback?: string) => string;
};

const SystemDataContext = createContext<SystemDataContextValue | null>(null);

const CULTURE_CACHE_KEY = 'CultureVersion';
const SUPPORTED_CULTURE_KEY = 'SupportedCultureCodes';
const DEFAULT_CULTURE = 'en';

const ESSENTIAL_TYPEINFOS = [
	'System.Language',
	'System.Country',
	'Account.Type',
	'System.PhoneCode',
	'System.Currency',
	'System.Usertype'
];

const SORT_BY_NAME = new Set([
	'System.Country',
	'System.Language',
	'System.WorldRegion',
	'System.Sector',
	'System.Currency',
	'System.PaypalCurrency'
]);

function safeJsonParse<T>(value: string | null): T | null {
	if (!value) return null;
	try {
		return JSON.parse(value) as T;
	} catch {
		return null;
	}
}

function normalizeCulture(code?: string) {
	if (!code) return DEFAULT_CULTURE;
	return code.toLowerCase();
}

type CultureCache = {
	metaData?: Record<string, string>;
	version?: number;
	code?: string;
};

function sortTypeInfos(items: TypeInfoItem[], typeKey: string) {
	if (!Array.isArray(items)) return [];
	const copy = [...items];
	if (SORT_BY_NAME.has(typeKey)) {
		return copy.sort((a, b) => `${a.Name || a.ValueText || ''}`.localeCompare(`${b.Name || b.ValueText || ''}`));
	}
	return copy.sort((a, b) => {
		const orderA = Number(a.Order ?? 0);
		const orderB = Number(b.Order ?? 0);
		if (orderA === orderB) {
			return `${a.Name || a.ValueText || ''}`.localeCompare(`${b.Name || b.ValueText || ''}`);
		}
		return orderA - orderB;
	});
}

function buildTypeInfoMapFromList(list: TypeInfoItem[]) {
	const next: Record<string, TypeInfoItem[]> = {};
	list.forEach((item) => {
		const type = item.Type;
		if (!type) return;
		if (!next[type]) {
			next[type] = [];
		}
		next[type].push(item);
	});
	Object.keys(next).forEach((key) => {
		next[key] = sortTypeInfos(next[key], key);
	});
	return next;
}

function mergeTypeInfoMaps(current: Record<string, TypeInfoItem[]>, incoming: Record<string, TypeInfoItem[]>) {
	const merged = { ...current };
	Object.entries(incoming).forEach(([key, value]) => {
		merged[key] = sortTypeInfos(value || [], key);
	});
	return merged;
}

function normalizeTypeInfoResult(
	result?: TypeInfoItem[] | Record<string, TypeInfoItem[]> | null
): Record<string, TypeInfoItem[]> {
	if (!result) return {};
	if (Array.isArray(result)) {
		return buildTypeInfoMapFromList(result);
	}
	return result;
}

function resolveSupportedCultures(payload: unknown): SupportedCulture[] {
	if (Array.isArray(payload)) return payload as SupportedCulture[];
	const result = (payload as { Result?: SupportedCulture[] })?.Result;
	return Array.isArray(result) ? result : [];
}

export function SystemDataProvider({ children }: { children: React.ReactNode }) {
	const { token } = useAuth();
	const [typeInfos, setTypeInfos] = useState<Record<string, TypeInfoItem[]>>({});
	const [culture, setCulture] = useState<Record<string, string>>({});
	const [currentCulture, setCurrentCulture] = useState(DEFAULT_CULTURE);
	const [supportedCultures, setSupportedCultures] = useState<SupportedCulture[]>([]);
	const [isReady, setIsReady] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const hasFullTypeInfos = useRef(false);
	const initRef = useRef(false);

	const getLabel = useCallback(
		(key: string, fallback?: string) => {
			if (!key) return fallback || '';
			const cultureKey = `${currentCulture}_${key}`;
			return culture[cultureKey] || culture[key] || fallback || key;
		},
		[culture, currentCulture]
	);

	const resolveCurrentCulture = useCallback(
		(codes: SupportedCulture[]) => {
			const stored = typeof window !== 'undefined' ? window.localStorage.getItem('CurrentCulture') : null;
			if (stored) return normalizeCulture(stored);
			const nav = typeof navigator !== 'undefined' ? navigator.language.toLowerCase() : DEFAULT_CULTURE;
			const exact = codes.find((item) => item.Code?.toLowerCase() === nav);
			const short = codes.find((item) => item.Code?.toLowerCase() === nav.split('-')[0]);
			return normalizeCulture(exact?.Code || short?.Code || DEFAULT_CULTURE);
		},
		[]
	);

	const loadCultureData = useCallback(async (cultureCode: string) => {
		const normalized = normalizeCulture(cultureCode);
		const cached = safeJsonParse<CultureCache>(
			typeof window !== 'undefined' ? window.localStorage.getItem(CULTURE_CACHE_KEY) : null
		);
		try {
			const version = await getCultureMetaDataVersion(CULTURE_CACHE_KEY);

			if (cached?.metaData && cached?.version === version && cached?.code === normalized) {
				setCulture(cached.metaData);
				return;
			}

			const payload = await getCultureData(normalized);
			window.localStorage.setItem(
				CULTURE_CACHE_KEY,
				JSON.stringify({ metaData: payload, version, code: normalized })
			);
			setCulture(payload || {});
		} catch {
			if (cached?.metaData && cached?.code === normalized) {
				setCulture(cached.metaData);
				return;
			}
			setCulture({});
		}
	}, []);

	const loadSupportedCultures = useCallback(async (cultureCode: string) => {
		try {
			const response = await getSupportedCultureCodes(cultureCode);
			const resolved = resolveSupportedCultures(response);
			setSupportedCultures(resolved);
			window.localStorage.setItem(
				SUPPORTED_CULTURE_KEY,
				JSON.stringify({ metaData: resolved, version: Date.now() })
			);
			return resolved;
		} catch {
			const cached = safeJsonParse<{ metaData?: SupportedCulture[] }>(
				typeof window !== 'undefined' ? window.localStorage.getItem(SUPPORTED_CULTURE_KEY) : null
			);
			const resolved = cached?.metaData || [];
			if (resolved.length) {
				setSupportedCultures(resolved);
			}
			return resolved;
		}
	}, []);

	const loadTypeInfos = useCallback(
		async (cultureCode: string, useFullList: boolean) => {
			if (useFullList) {
				const response = await getTypeInfosList(cultureCode);
				const list = response?.Result || [];
				const mapped = buildTypeInfoMapFromList(list);
				setTypeInfos((prev) => mergeTypeInfoMaps(prev, mapped));
				hasFullTypeInfos.current = true;
				return;
			}

			const response = await getTypeInfosInit(cultureCode, ESSENTIAL_TYPEINFOS);
			const mapped = normalizeTypeInfoResult(response?.Result);
			setTypeInfos((prev) => mergeTypeInfoMaps(prev, mapped));
		},
		[]
	);

	const refreshAll = useCallback(async () => {
		setIsLoading(true);
		setError(null);
		try {
			const preferredCulture =
				typeof window !== 'undefined'
					? normalizeCulture(window.localStorage.getItem('CurrentCulture') || navigator.language)
					: DEFAULT_CULTURE;
			const supported = await loadSupportedCultures(preferredCulture);
			const resolvedCulture = resolveCurrentCulture(supported);
			setCurrentCulture(resolvedCulture);
			window.localStorage.setItem('CurrentCulture', resolvedCulture);
			setApiLanguage(resolvedCulture);
			await loadCultureData(resolvedCulture);
			await loadTypeInfos(resolvedCulture, Boolean(token));
			setIsReady(true);
		} catch (err) {
			setError('Failed to load system data.');
		} finally {
			setIsLoading(false);
		}
	}, [currentCulture, loadCultureData, loadSupportedCultures, loadTypeInfos, resolveCurrentCulture, token]);

	const refreshTypeInfos = useCallback(
		async (types?: string[]) => {
			if (!currentCulture) return;
			setIsLoading(true);
			setError(null);
			try {
				if (types && types.length) {
					const response = await getTypeInfosInit(currentCulture, types);
					const mapped = normalizeTypeInfoResult(response?.Result);
					setTypeInfos((prev) => mergeTypeInfoMaps(prev, mapped));
					return;
				}
				await loadTypeInfos(currentCulture, Boolean(token));
			} catch {
				setError('Failed to load type information.');
			} finally {
				setIsLoading(false);
			}
		},
		[currentCulture, loadTypeInfos, token]
	);

	const setCultureCode = useCallback(
		async (code: string) => {
			const normalized = normalizeCulture(code);
			window.localStorage.setItem('CurrentCulture', normalized);
			setCurrentCulture(normalized);
			setApiLanguage(normalized);
			await loadCultureData(normalized);
			await loadTypeInfos(normalized, Boolean(token));
		},
		[loadCultureData, loadTypeInfos, token]
	);

	useEffect(() => {
		if (typeof window === 'undefined') return;
		const cachedCulture = safeJsonParse<CultureCache>(
			window.localStorage.getItem(CULTURE_CACHE_KEY)
		);
		const cachedSupported = safeJsonParse<{ metaData?: SupportedCulture[] }>(
			window.localStorage.getItem(SUPPORTED_CULTURE_KEY)
		);
		if (cachedSupported?.metaData) {
			setSupportedCultures(cachedSupported.metaData);
		}

		const storedCulture = window.localStorage.getItem('CurrentCulture');
		if (storedCulture) {
			const normalized = normalizeCulture(storedCulture);
			setCurrentCulture(normalized);
			setApiLanguage(normalized);
			if (cachedCulture?.metaData && cachedCulture?.code === normalized) {
				setCulture(cachedCulture.metaData);
			}
		}
	}, []);

	useEffect(() => {
		if (initRef.current) return;
		initRef.current = true;
		refreshAll();
	}, [refreshAll]);

	useEffect(() => {
		if (!token) return;
		if (!isReady) return;
		if (hasFullTypeInfos.current) return;
		loadTypeInfos(currentCulture, true);
	}, [token, isReady, loadTypeInfos, currentCulture]);

	const contextValue = useMemo(
		() => ({
			typeInfos,
			culture,
			currentCulture,
			supportedCultures,
			isReady,
			isLoading,
			error,
			refreshAll,
			refreshTypeInfos,
			setCultureCode,
			getLabel
		}),
		[
			typeInfos,
			culture,
			currentCulture,
			supportedCultures,
			isReady,
			isLoading,
			error,
			refreshAll,
			refreshTypeInfos,
			setCultureCode,
			getLabel
		]
	);

	return <SystemDataContext.Provider value={contextValue}>{children}</SystemDataContext.Provider>;
}

export function useSystemData() {
	const ctx = useContext(SystemDataContext);
	if (!ctx) {
		throw new Error('SystemDataProvider is missing in the component tree.');
	}
	return ctx;
}

export default SystemDataContext;
