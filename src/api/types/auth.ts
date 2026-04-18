export type AuthLoginPayload = {
	Email: string;
	Password: string;
	LastLoginRegionCode?: string | null;
	LastLoginIP?: string | null;
	LastLoginCountryCode?: string | null;
	IsMobile?: boolean;
	IsExternal?: boolean;
	F2a?: boolean;
	F2aKey?: string;
	Provider?: string;
};

export type AuthRegisterPayload = {
	Email: string;
	Phone?: string;
	Username: string;
	Password: string;
	ConfirmPassword: string;
	CountryId: number;
	CountryCode: string;
	AccountType: number;
	Language: number;
	FirstName: string;
	LastName: string;
	CompanyName?: string;
	LastLoginIP?: string | null;
	LastLoginCountryCode?: string | null;
	LastLoginRegionCode?: string | null;
	SignUpRef?: string;
	IsMobile?: boolean;
	IsAdminMobile?: boolean;
};

export type AuthLoginResponse =
	| number
	| string
	| {
			fa2?: boolean;
			IsExternal?: boolean;
			Domain?: string;
			Email?: string;
			Password?: string;
			AccessToken?: string;
			accessToken?: string;
			token?: string;
	  };
