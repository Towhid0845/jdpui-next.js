const signinErrors: Record<string, string> = {
	default: 'Unable to sign in.',
	Signin: 'Try signing in with a different account.',
	OAuthSignin: 'Try signing in with a different account.',
	OAuthCallbackError: 'Try signing in with a different account.',
	OAuthCreateAccount: 'Try signing in with a different account.',
	EmailCreateAccount: 'Try signing in with a different account.',
	Callback: 'Try signing in with a different account.',
	OAuthAccountNotLinked: 'To confirm your identity, sign in with the same account you used originally.',
	EmailSignin: 'The e-mail could not be sent.',
	CredentialsSignin: 'Sign in failed. Check the details you provided are correct.',
	SessionRequired: 'Please sign in to access this page.',
	INVALID_LOGIN: 'Invalid login information.',
	SIGNIN_FAILED: 'Something went wrong. Please try again.',
	ACCOUNT_INACTIVE: 'Your account is inactive. Please contact support.',
	EMAIL_NOT_VERIFIED: 'Your email is not verified. Please check your inbox.',
	TWO_FACTOR_REQUIRED: 'Two-factor authentication is required.',
	EXTERNAL_LOGIN_REQUIRED: 'External login is required to access this account.',
	TOKEN_MISSING: 'Unable to establish a session. Please try again.',
	SIGNUP_NOT_CONFIGURED: 'Sign up is not configured yet.',
	API_BASE_URL_MISSING: 'Missing backend API configuration.'
};

export default signinErrors;
