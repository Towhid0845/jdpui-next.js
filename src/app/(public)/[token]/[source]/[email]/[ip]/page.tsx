'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authLogin } from '@/api/services/auth';
import { getGeoLocation } from '@/api/services/geo';
import { getUserInfoByEmail, getUserInfoByPhone } from '@/api/services/user';
import FuseLoading from '@fuse/core/FuseLoading';
import { Alert } from '@mui/material';
import { useAuth } from '@auth/AuthProvider';

type PageProps = {
	params: {
		token: string;
		source: string;
		email: string;
		ip: string;
	};
};

function resolveRedirectFromUser(userInfo: any): string {
	switch (userInfo?.AccountType) {
		case 1:
		case 3:
			return '/dashboard';
		case 2:
			return '/my-profiles';
		case 4:
			return '/services';
		default:
			return '/sign-in';
	}
}

function decodeExternalRedirect(value: string) {
	try {
		const decoded = decodeURIComponent(value);
		let output = decoded.split('Í¶').join('/');
		output = output.replace('*', '/');
		return output;
	} catch {
		return '';
	}
}

export default function ExternalLoginPage({ params }: PageProps) {
	const router = useRouter();
	const [error, setError] = useState<string | null>(null);
	const { signInExternal } = useAuth();

	useEffect(() => {
		let isActive = true;

		const run = async () => {
			try {
				const tokenParam = decodeURIComponent(params.token);
				const sourceParam = decodeURIComponent(params.source);
				const emailParam = decodeURIComponent(params.email);
				const ipParam = decodeURIComponent(params.ip);

				if (!tokenParam || !sourceParam || !emailParam) {
					throw new Error('Missing parameters');
				}

				if (tokenParam === 'appmapregion') {
					const geo = await getGeoLocation();
					const ip = geo?.IpObject?.query ?? null;
					const countryCode = geo?.IpObject?.countryCode ?? null;
					const region = geo?.IpObject?.region ?? null;

					const loginPayload = await authLogin({
						Email: sourceParam,
						Password: emailParam,
						LastLoginIP: ip,
						LastLoginCountryCode: countryCode,
						LastLoginRegionCode: region,
						IsMobile: false,
						IsExternal: true
					});

					const accessToken =
						(typeof loginPayload === 'string' && loginPayload) ||
						(loginPayload as any)?.Token ||
						(loginPayload as any)?.token ||
						(loginPayload as any)?.AccessToken ||
						(loginPayload as any)?.accessToken;

					if (!accessToken) {
						throw new Error('Login failed');
					}

					const userInfo = await getUserInfoByEmail(
						((loginPayload as any)?.Email as string) || sourceParam,
						accessToken,
						false
					);

					if (!userInfo) {
						throw new Error('User not found');
					}

					const externalResult = await signInExternal({
						token: accessToken,
						email: ((loginPayload as any)?.Email as string) || sourceParam,
						isMobile: false
					});

					if (!externalResult.ok) {
						throw new Error('Login failed');
					}

					const target = resolveRedirectFromUser(userInfo);
					router.replace(target);
					return;
				}

				if (sourceParam === 'signup_rdct_home_m') {
					localStorage.setItem(`preq_${emailParam}`, 'true');

					const userInfo = await getUserInfoByPhone(emailParam, tokenParam);
					if (!userInfo) {
						throw new Error('User not found');
					}

					const externalResult = await signInExternal({
						token: tokenParam,
						phone: emailParam,
						isMobile: true
					});

					if (!externalResult.ok) {
						throw new Error('Login failed');
					}

					router.replace(resolveRedirectFromUser(userInfo));
					return;
				}

				const userInfo = await getUserInfoByEmail(emailParam, tokenParam, false);
				if (!userInfo) {
					throw new Error('User not found');
				}

				const externalResult = await signInExternal({
					token: tokenParam,
					email: emailParam,
					isMobile: false
				});

				if (!externalResult.ok) {
					throw new Error('Login failed');
				}

				const externalRedirect = decodeExternalRedirect(ipParam);
				if (externalRedirect) {
					window.location.replace(externalRedirect);
					return;
				}

				router.replace(resolveRedirectFromUser(userInfo));
			} catch (err) {
				if (!isActive) return;
				setError('Unable to complete external login. Please sign in again.');
				setTimeout(() => router.replace('/sign-in'), 1500);
			}
		};

		run();

		return () => {
			isActive = false;
		};
	}, [params, router]);

	if (error) {
		return (
			<div className="flex h-full w-full items-center justify-center p-6">
				<Alert severity="error">{error}</Alert>
			</div>
		);
	}

	return <FuseLoading />;
}
