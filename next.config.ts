import type { NextConfig } from 'next';

const isTurbopack = process.env.TURBOPACK === '1';

// Conditionally add webpack configuration only when NOT using turbopack
const nextConfig: NextConfig = {
	reactStrictMode: false,
	env: {
		API_BASE_URL: process.env.API_BASE_URL,
		JD_ENTERPRISE_BASE_URL: process.env.JD_ENTERPRISE_BASE_URL,
		APP_PRODUCTION: process.env.APP_PRODUCTION,
		APP_HMR: process.env.APP_HMR,
		ACTIVE_ORIGIN: process.env.ACTIVE_ORIGIN,
		APP_VERSION: process.env.APP_VERSION,
		GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
		GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
		GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
		FACEBOOK_APP_ID: process.env.FACEBOOK_APP_ID,
		FACEBOOK_APP_SECRET: process.env.FACEBOOK_APP_SECRET,
		UNSPLASH_CLIENT_ID: process.env.UNSPLASH_CLIENT_ID,
		ZEROBOUNCE_API_KEY: process.env.ZEROBOUNCE_API_KEY,
		JDP_HEADER_TOKEN: process.env.JDP_HEADER_TOKEN,
		OTP_TOKEN: process.env.OTP_TOKEN
	},
	typescript: {
		// Dangerously allow production builds to successfully complete even if
		// your project has type errors.
		// ignoreBuildErrors: true
	},
	turbopack: {
		root: __dirname,
		rules: {}
	},
	...(!isTurbopack && {
		webpack: (config) => {
			if (config.module && config.module.rules) {
				config.module.rules.push({
					test: /\.(json|js|ts|tsx|jsx)$/,
					resourceQuery: /raw/,
					use: 'raw-loader'
				});
			}

			return config;
		}
	})
};

export default nextConfig;
