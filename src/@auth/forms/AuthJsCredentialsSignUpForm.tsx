import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import _ from 'lodash';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import FormHelperText from '@mui/material/FormHelperText';
import { Alert } from '@mui/material';
import { authRegister } from '@/api/services/auth';
import { TypeInfoItem } from '@/api/services/typeInfos';
import { getGeoLocation, GeoLocationResponse } from '@/api/services/geo';
import { useSystemData } from '@/contexts/SystemDataContext';

/**
 * Form Validation Schema
 */
const schema = z
	.object({
		accountType: z.coerce.number().min(1, 'Account type is required'),
		country: z.coerce.number().min(1, 'Country is required'),
		language: z.coerce.number().min(1, 'Language is required'),
		firstName: z.string().optional(),
		lastName: z.string().optional(),
		companyName: z.string().optional(),
		email: z.string().email('You must enter a valid email').nonempty('You must enter an email'),
		password: z
			.string()
			.nonempty('Please enter your password.')
			.min(6, 'Password is too short - should be 6 chars minimum.'),
		passwordConfirm: z.string().nonempty('Password confirmation is required'),
		acceptTermsConditions: z.boolean().refine((val) => val === true, 'The terms and conditions must be accepted.')
	})
	.refine((data) => data.password === data.passwordConfirm, {
		message: 'Passwords must match',
		path: ['passwordConfirm']
	});

const defaultValues = {
	accountType: 1,
	country: 0,
	language: 0,
	firstName: '',
	lastName: '',
	companyName: '',
	email: '',
	password: '',
	passwordConfirm: '',
	acceptTermsConditions: false
};

export type FormType = {
	accountType: number;
	country: number;
	language: number;
	firstName?: string;
	lastName?: string;
	companyName?: string;
	password: string;
	email: string;
};

function AuthJsCredentialsSignUpForm() {
	const { control, formState, handleSubmit, setError, setValue, watch } = useForm({
		mode: 'onChange',
		defaultValues,
		resolver: zodResolver(schema)
	});

	const { isValid, dirtyFields, errors } = formState;
	const searchParams = useSearchParams();

	const [geoInfo, setGeoInfo] = useState<GeoLocationResponse | null>(null);
	const [submitMessage, setSubmitMessage] = useState<string | null>(null);
	const [submitError, setSubmitError] = useState<string | null>(null);

	const { typeInfos, isReady: systemReady, isLoading: systemLoading } = useSystemData();

	const countries = useMemo<TypeInfoItem[]>(
		() => typeInfos['System.Country'] || [],
		[typeInfos]
	);
	const languages = useMemo<TypeInfoItem[]>(
		() => typeInfos['System.Language'] || [],
		[typeInfos]
	);
	const accountTypes = useMemo<TypeInfoItem[]>(
		() => typeInfos['Account.Type'] || [],
		[typeInfos]
	);

	const loadingTypes = !systemReady || systemLoading;

	const selectedCountryValue = watch('country');
	const accountTypeValue = watch('accountType');
	const languageValue = watch('language');
	const selectedCountry = useMemo(
		() => countries.find((item) => item.Value === Number(selectedCountryValue)),
		[countries, selectedCountryValue]
	);

	useEffect(() => {
		getGeoLocation().then((geo) => setGeoInfo(geo));
	}, []);

	useEffect(() => {
		const accountTypeParam = searchParams.get('actype');
		if (!accountTypeParam) return;

		const normalized = accountTypeParam.toLowerCase();
		const mapping: Record<string, number> = {
			candidate: 2,
			recruiter: 1,
			company: 3,
			'hr-manager': 3,
			manager: 3,
			seller: 4
		};

		const mapped = mapping[normalized];
		if (mapped) {
			setValue('accountType', mapped, { shouldDirty: false, shouldValidate: true });
		}
	}, [searchParams, setValue]);

	useEffect(() => {
		if (loadingTypes) return;

		const currentAccountType = Number(accountTypeValue || 0);
		if (!currentAccountType && accountTypes.length) {
			setValue('accountType', accountTypes[0].Value, { shouldDirty: false, shouldValidate: true });
		}

		const currentCountry = Number(selectedCountryValue || 0);
		if (!currentCountry && countries.length) {
			const geoCountryCode = geoInfo?.IpObject?.countryCode?.toLowerCase();
			const matchedCountry = geoCountryCode
				? countries.find((item) => item.ValueText?.toLowerCase() === geoCountryCode)
				: undefined;
			setValue('country', (matchedCountry || countries[0]).Value, {
				shouldDirty: false,
				shouldValidate: true
			});
		}

		const currentLanguage = Number(languageValue || 0);
		if (!currentLanguage && languages.length) {
			const geoLang = geoInfo?.IpObject?.langCode?.toLowerCase();
			const matchedLang = geoLang
				? languages.find((item) => item.ValueText?.toLowerCase() === geoLang)
				: undefined;
			setValue('language', (matchedLang || languages[0]).Value, {
				shouldDirty: false,
				shouldValidate: true
			});
		}
	}, [
		loadingTypes,
		accountTypes,
		countries,
		languages,
		geoInfo,
		setValue,
		accountTypeValue,
		selectedCountryValue,
		languageValue
	]);

	async function onSubmit(formData: FormType) {
		setSubmitError(null);
		setSubmitMessage(null);

		const country = countries.find((item) => item.Value === formData.country);
		const language = languages.find((item) => item.Value === formData.language);

		if (!country) {
			setError('country', { type: 'manual', message: 'Country is required' });
			return false;
		}

		if (!language) {
			setError('language', { type: 'manual', message: 'Language is required' });
			return false;
		}

		const signupRef = searchParams.get('ref') || undefined;
		const geo = geoInfo?.IpObject;

		const payload = {
			AccountType: formData.accountType,
			CountryCode: country.ValueText,
			CountryId: country.Value,
			Email: formData.email,
			Password: formData.password,
			Username: formData.email,
			ConfirmPassword: formData.passwordConfirm,
			Language: language.Value,
			FirstName: formData.firstName || '',
			LastName: formData.lastName || '',
			CompanyName: formData.companyName || '',
			LastLoginIP: geo?.query ?? null,
			LastLoginCountryCode: geo?.countryCode ?? null,
			LastLoginRegionCode: geo?.region ?? null,
			SignUpRef: signupRef,
			IsMobile: false
		};

		const response = await authRegister(payload);

		if (response === 3) {
			setSubmitMessage('Registration successful. Please check your email inbox.');
			return true;
		}

		if (response === 1) {
			setSubmitError('Email already taken. Please use another email.');
			return false;
		}

		if (response === 2) {
			setSubmitError('Password requires minimum 6 characters.');
			return false;
		}

		if (response === 4) {
			setSubmitError('Invalid email. Please try another email.');
			return false;
		}

		setSubmitError('Something went wrong. Please try again.');
		return false;
	}

	return (
		<form
			name="registerForm"
			noValidate
			className="flex w-full flex-col justify-center"
			onSubmit={handleSubmit(onSubmit)}
		>
			{submitError && (
				<Alert
					className="mb-8"
					severity="error"
					sx={(theme) => ({
						backgroundColor: theme.palette.error.light,
						color: theme.palette.error.dark
					})}
				>
					{submitError}
				</Alert>
			)}
			{submitMessage && (
				<Alert
					className="mb-8"
					severity="success"
				>
					{submitMessage}
				</Alert>
			)}
			<Controller
				name="accountType"
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						select
						className="mb-6"
						label="Account type"
						error={!!errors.accountType}
						helperText={errors?.accountType?.message}
						variant="outlined"
						required
						fullWidth
						disabled={loadingTypes}
					>
						{accountTypes.map((item) => (
							<MenuItem
								key={item.Value}
								value={item.Value}
							>
								{item.Name || item.ValueText}
							</MenuItem>
						))}
					</TextField>
				)}
			/>
			<Controller
				name="country"
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						className="mb-6"
						select
						label="Country"
						error={!!errors.country}
						helperText={errors?.country?.message}
						variant="outlined"
						required
						fullWidth
						disabled={loadingTypes}
					>
						{countries.map((item) => (
							<MenuItem
								key={item.Value}
								value={item.Value}
							>
								{item.Name || item.ValueText}
							</MenuItem>
						))}
					</TextField>
				)}
			/>
			<Controller
				name="language"
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						className="mb-6"
						select
						label="Language"
						error={!!errors.language}
						helperText={errors?.language?.message}
						variant="outlined"
						required
						fullWidth
						disabled={loadingTypes}
					>
						{languages.map((item) => (
							<MenuItem
								key={item.Value}
								value={item.Value}
							>
								{item.Name || item.ValueText}
							</MenuItem>
						))}
					</TextField>
				)}
			/>
			<Controller
				name="firstName"
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						className="mb-6"
						label="First name"
						type="text"
						error={!!errors.firstName}
						helperText={errors?.firstName?.message}
						variant="outlined"
						fullWidth
					/>
				)}
			/>
			<Controller
				name="lastName"
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						className="mb-6"
						label="Last name"
						type="text"
						error={!!errors.lastName}
						helperText={errors?.lastName?.message}
						variant="outlined"
						fullWidth
					/>
				)}
			/>
			<Controller
				name="companyName"
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						className="mb-6"
						label="Company name"
						type="text"
						error={!!errors.companyName}
						helperText={errors?.companyName?.message}
						variant="outlined"
						fullWidth
					/>
				)}
			/>
			<Controller
				name="email"
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						className="mb-6"
						label="Email"
						type="email"
						error={!!errors.email}
						helperText={errors?.email?.message}
						variant="outlined"
						required
						fullWidth
					/>
				)}
			/>
			<Controller
				name="password"
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						className="mb-6"
						label="Password"
						type="password"
						error={!!errors.password}
						helperText={errors?.password?.message}
						variant="outlined"
						required
						fullWidth
					/>
				)}
			/>
			<Controller
				name="passwordConfirm"
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						className="mb-6"
						label="Password (Confirm)"
						type="password"
						error={!!errors.passwordConfirm}
						helperText={errors?.passwordConfirm?.message}
						variant="outlined"
						required
						fullWidth
					/>
				)}
			/>
			<Controller
				name="acceptTermsConditions"
				control={control}
				render={({ field }) => (
					<FormControl error={!!errors.acceptTermsConditions}>
						<FormControlLabel
							label="I agree with Terms and Privacy Policy"
							control={
								<Checkbox
									size="small"
									{...field}
								/>
							}
						/>
						<FormHelperText>{errors?.acceptTermsConditions?.message}</FormHelperText>
					</FormControl>
				)}
			/>
			<Button
				variant="contained"
				color="secondary"
				className="mt-6 w-full"
				aria-label="Register"
				disabled={_.isEmpty(dirtyFields) || !isValid || loadingTypes || !selectedCountry}
				type="submit"
				size="large"
			>
				Create your free account
			</Button>
		</form>
	);
}

export default AuthJsCredentialsSignUpForm;
