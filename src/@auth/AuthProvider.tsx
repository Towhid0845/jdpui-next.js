'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import UserModel from '@auth/user/models/UserModel';
import { User } from '@auth/user';
import { authLogin } from '@/api/services/auth';
import { getUserInfoByEmail, getUserInfoByPhone } from '@/api/services/user';
import { setApiAuthToken, setApiLanguage } from '@/api/jdpClient';

type StorageType = 'local' | 'session';

type SignInResult = {
	ok: boolean;
	error?: string;
	redirectUrl?: string;
	user?: User;
};

type ExternalSignInParams = {
	token: string;
	email?: string;
	phone?: string;
	isMobile?: boolean;
	remember?: boolean;
};

type AuthContextValue = {
	user: User | null;
	token: string | null;
	isGuest: boolean;
	isReady: boolean;
	signIn: (email: string, password: string, remember?: boolean) => Promise<SignInResult>;
	signInExternal: (params: ExternalSignInParams) => Promise<SignInResult>;
	signOut: () => void;
	updateUser: (updates: Partial<User>) => void;
};

const STORAGE_KEYS = {
	user: 'jd_auth_user',
	token: 'jd_auth_token',
	storage: 'jd_auth_storage'
};

const AuthContext = createContext<AuthContextValue | null>(null);

function parseRoles(userInfo: any): string[] | null {
	const rolesSet = new Set<string>();
	const roles = userInfo?.UserRoles ?? userInfo?.roles;

	if (typeof roles === 'string') {
		roles
			.split(';')
			.map((role: string) => role.trim().toLowerCase())
			.filter(Boolean)
			.forEach((role: string) => rolesSet.add(role));
	}

	if (Array.isArray(roles)) {
		roles
			.map((role: string) => `${role}`.trim().toLowerCase())
			.filter(Boolean)
			.forEach((role: string) => rolesSet.add(role));
	}

	switch (userInfo?.AccountType) {
		case 1:
			rolesSet.add('recruiter');
			break;
		case 2:
			rolesSet.add('candidate');
			break;
		case 3:
			rolesSet.add('company');
			break;
		case 4:
			rolesSet.add('seller');
			break;
		default:
			break;
	}

	if (rolesSet.has('client')) {
		rolesSet.add('company');
	}

	if (!rolesSet.size) {
		return null;
	}

	return Array.from(rolesSet);
}

function resolveLoginRedirectUrl(userInfo: any): string {
	switch (userInfo?.AccountType) {
		case 1:
		case 3:
			return '/dashboard';
		case 2:
			return '/my-profiles';
		case 4:
			return '/services';
		default:
			return '/';
	}
}

function safeJsonParse<T>(value: string | null): T | null {
	if (!value) return null;
	try {
		return JSON.parse(value) as T;
	} catch {
		return null;
	}
}

function readStoredSession() {
	if (typeof window === 'undefined') {
		return { user: null, token: null, storageType: null as StorageType | null };
	}

	const localUser = safeJsonParse<User>(window.localStorage.getItem(STORAGE_KEYS.user));
	const localToken = window.localStorage.getItem(STORAGE_KEYS.token);

	if (localUser && localToken) {
		return { user: localUser, token: localToken, storageType: 'local' as const };
	}

	const sessionUser = safeJsonParse<User>(window.sessionStorage.getItem(STORAGE_KEYS.user));
	const sessionToken = window.sessionStorage.getItem(STORAGE_KEYS.token);

	if (sessionUser && sessionToken) {
		return { user: sessionUser, token: sessionToken, storageType: 'session' as const };
	}

	return { user: null, token: null, storageType: null as StorageType | null };
}

function writeStoredSession(storage: Storage, storageType: StorageType, user: User, token: string) {
	storage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
	storage.setItem(STORAGE_KEYS.token, token);
	storage.setItem(STORAGE_KEYS.storage, storageType);
}

function clearStoredSession() {
	if (typeof window === 'undefined') return;
	window.localStorage.removeItem(STORAGE_KEYS.user);
	window.localStorage.removeItem(STORAGE_KEYS.token);
	window.localStorage.removeItem(STORAGE_KEYS.storage);
	window.sessionStorage.removeItem(STORAGE_KEYS.user);
	window.sessionStorage.removeItem(STORAGE_KEYS.token);
	window.sessionStorage.removeItem(STORAGE_KEYS.storage);
}

function resolveCulture() {
	if (typeof window === 'undefined') {
		return undefined;
	}

	const stored = window.localStorage.getItem('CurrentCulture');
	return stored ? stored : navigator.language.toLowerCase();
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [token, setToken] = useState<string | null>(null);
	const [storageType, setStorageType] = useState<StorageType | null>(null);
	const [isReady, setIsReady] = useState(false);

	useEffect(() => {
		const stored = readStoredSession();
		setUser(stored.user);
		setToken(stored.token);
		setStorageType(stored.storageType);
		setIsReady(true);
	}, []);

	useEffect(() => {
		setApiAuthToken(token);
	}, [token]);

	useEffect(() => {
		const culture = resolveCulture();
		if (culture) {
			setApiLanguage(culture);
		}
	}, []);

	const persistSession = useCallback(
		(nextUser: User, nextToken: string, remember = true) => {
			if (typeof window === 'undefined') return;

			const storage = remember ? window.localStorage : window.sessionStorage;
			const nextStorageType: StorageType = remember ? 'local' : 'session';

			writeStoredSession(storage, nextStorageType, nextUser, nextToken);
			if (remember) {
				window.sessionStorage.removeItem(STORAGE_KEYS.user);
				window.sessionStorage.removeItem(STORAGE_KEYS.token);
			} else {
				window.localStorage.removeItem(STORAGE_KEYS.user);
				window.localStorage.removeItem(STORAGE_KEYS.token);
			}

			setStorageType(nextStorageType);
		},
		[setStorageType]
	);

	const signIn = useCallback<AuthContextValue['signIn']>(
		async (email, password, remember = true) => {
			if (!email || !password) {
				return { ok: false, error: 'INVALID_LOGIN' };
			}

			let loginPayload: unknown;
			try {
				loginPayload = await authLogin({
					Email: email,
					Password: password,
					LastLoginRegionCode: null,
					LastLoginIP: null,
					LastLoginCountryCode: null,
					IsMobile: false
				});
			} catch (error) {
				if (error instanceof Error && error.message === 'API_BASE_URL_MISSING') {
					return { ok: false, error: 'API_BASE_URL_MISSING' };
				}
				return { ok: false, error: 'SIGNIN_FAILED' };
			}

			if (typeof loginPayload === 'number') {
				switch (loginPayload) {
					case 0:
						return { ok: false, error: 'INVALID_LOGIN' };
					case 1:
						return { ok: false, error: 'SIGNIN_FAILED' };
					case 2:
						return { ok: false, error: 'ACCOUNT_INACTIVE' };
					case 3:
						return { ok: false, error: 'EMAIL_NOT_VERIFIED' };
					default:
						return { ok: false, error: 'SIGNIN_FAILED' };
				}
			}

			if (loginPayload === 'unauthorized') {
				return { ok: false, error: 'INVALID_LOGIN' };
			}

			if (loginPayload && typeof loginPayload === 'object') {
				if ((loginPayload as { fa2?: boolean }).fa2) {
					return { ok: false, error: 'TWO_FACTOR_REQUIRED' };
				}

				if ((loginPayload as { IsExternal?: boolean }).IsExternal) {
					return { ok: false, error: 'EXTERNAL_LOGIN_REQUIRED' };
				}
			}

			const accessToken =
				(typeof loginPayload === 'string' && loginPayload) ||
				(loginPayload as any)?.token ||
				(loginPayload as any)?.Token ||
				(loginPayload as any)?.AccessToken ||
				(loginPayload as any)?.accessToken;

			if (!accessToken) {
				return { ok: false, error: 'TOKEN_MISSING' };
			}

			let userInfo: unknown;
			try {
				userInfo = await getUserInfoByEmail(email, accessToken, false);
			} catch (error) {
				if (error instanceof Error && error.message === 'API_BASE_URL_MISSING') {
					return { ok: false, error: 'API_BASE_URL_MISSING' };
				}
				return { ok: false, error: 'SIGNIN_FAILED' };
			}

			if (!userInfo || userInfo === 'unauthorized') {
				return { ok: false, error: 'INVALID_LOGIN' };
			}

			const role = parseRoles(userInfo);
			const dbUser = UserModel({
				id: String(userInfo?.Rid ?? userInfo?.id ?? email),
				displayName: userInfo?.FullName ?? userInfo?.FirstName ?? userInfo?.Email ?? email,
				email: userInfo?.Email ?? email,
				role,
				loginRedirectUrl: resolveLoginRedirectUrl(userInfo),
				accountType: userInfo?.AccountType,
				profile: userInfo
			});

			setUser(dbUser);
			setToken(accessToken);
			persistSession(dbUser, accessToken, remember);

			return { ok: true, redirectUrl: dbUser.loginRedirectUrl || '/', user: dbUser };
		},
		[persistSession]
	);

	const signInExternal = useCallback<AuthContextValue['signInExternal']>(
		async ({ token: externalToken, email, phone, isMobile = false, remember = true }) => {
			if (!externalToken || (!email && !phone)) {
				return { ok: false, error: 'INVALID_LOGIN' };
			}

			let userInfo: unknown;
			try {
				userInfo = phone
					? await getUserInfoByPhone(phone, externalToken)
					: await getUserInfoByEmail(email || '', externalToken, isMobile);
			} catch (error) {
				if (error instanceof Error && error.message === 'API_BASE_URL_MISSING') {
					return { ok: false, error: 'API_BASE_URL_MISSING' };
				}
				return { ok: false, error: 'SIGNIN_FAILED' };
			}

			if (!userInfo || userInfo === 'unauthorized') {
				return { ok: false, error: 'INVALID_LOGIN' };
			}

			const role = parseRoles(userInfo);
			const dbUser = UserModel({
				id: String(userInfo?.Rid ?? userInfo?.id ?? email ?? phone),
				displayName: userInfo?.FullName ?? userInfo?.FirstName ?? userInfo?.Email ?? email ?? phone,
				email: userInfo?.Email ?? email ?? '',
				role,
				loginRedirectUrl: resolveLoginRedirectUrl(userInfo),
				accountType: userInfo?.AccountType,
				profile: userInfo
			});

			setUser(dbUser);
			setToken(externalToken);
			persistSession(dbUser, externalToken, remember);

			return { ok: true, redirectUrl: dbUser.loginRedirectUrl || '/', user: dbUser };
		},
		[persistSession]
	);

	const signOut = useCallback(() => {
		clearStoredSession();
		setUser(null);
		setToken(null);
		setStorageType(null);
		setIsReady(true);
	}, []);

	const updateUser = useCallback(
		(updates: Partial<User>) => {
			if (!user) return;
			if (typeof window === 'undefined') return;
			const merged = UserModel({ ...user, ...updates });
			setUser(merged);
			if (token) {
				const storage = storageType === 'session' ? window.sessionStorage : window.localStorage;
				writeStoredSession(storage, storageType || 'local', merged, token);
			}
		},
		[user, token, storageType]
	);

	const isGuest = useMemo(() => {
		if (!user?.role) return true;
		if (Array.isArray(user.role)) {
			return user.role.length === 0;
		}
		return !user.role;
	}, [user]);

	const value = useMemo(
		() => ({
			user,
			token,
			isGuest,
			isReady,
			signIn,
			signInExternal,
			signOut,
			updateUser
		}),
		[user, token, isGuest, isReady, signIn, signInExternal, signOut, updateUser]
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const ctx = useContext(AuthContext);
	if (!ctx) {
		throw new Error('AuthProvider is missing in the component tree.');
	}
	return ctx;
}
