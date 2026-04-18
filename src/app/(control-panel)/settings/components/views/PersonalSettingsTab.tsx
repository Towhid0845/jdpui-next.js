'use client';

import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
	Alert,
	Box,
	Button,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControl,
	FormLabel,
	InputAdornment,
	MenuItem,
	Select,
	TextField,
	Typography
} from '@mui/material';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import _ from 'lodash';
import useUser from '@auth/useUser';
import { User } from '@auth/user';
import { TypeInfoItem } from '@/api/services/typeInfos';
import { updateUserProfile, checkNumberAndSendOtp, verifyOtp } from '@/api/services/userSettings';
import { getUserInfoByEmail } from '@/api/services/user';
import { useSystemData } from '@/contexts/SystemDataContext';

type SupportedCulture = {
	Id?: string;
	Code?: string;
	NativeName?: string;
	LanguageId?: number;
	Title?: string;
	Flag?: string;
};

type PersonalSettingsTabProps = {
	user: User;
	countries: TypeInfoItem[];
	currencies: TypeInfoItem[];
	phoneCodes: TypeInfoItem[];
	supportedCultures: SupportedCulture[];
};

type OtpRequest = {
	guid: string;
	number: string;
	iso2: string;
	payload: Record<string, unknown>;
	phoneChanged: boolean;
	formSnapshot: FormType;
};

const schema = z.object({
	firstName: z.string().min(1, 'First name is required'),
	lastName: z.string().min(1, 'Last name is required'),
	email: z.string().email().optional(),
	phoneNumber: z.string().optional(),
	zip: z.string().optional(),
	place: z.string().optional(),
	state: z.string().optional(),
	country: z.union([z.string(), z.number()]).optional(),
	language: z.union([z.string(), z.number()]).optional(),
	currency: z.string().min(1, 'Currency is required')
});

type FormType = z.infer<typeof schema>;

function normalizeDigits(value: string) {
	return value.replace(/\D/g, '');
}

function getFlagEmoji(code?: string) {
	if (!code) return '';
	const upper = code.trim().toUpperCase();
	if (upper.length !== 2) return '';
	const charCodes = [...upper].map((char) => 127397 + char.charCodeAt(0));
	return String.fromCodePoint(...charCodes);
}

function validateBangladeshNumber(number: string) {
	return /^(?:\+?88|0088)?01[15-9]\d{8}$/.test(number);
}

type OtpDialogProps = {
	open: boolean;
	request: OtpRequest | null;
	onClose: () => void;
	onVerified: (request: OtpRequest) => void;
};

function OtpDialog({ open, request, onClose, onVerified }: OtpDialogProps) {
	const [otp, setOtp] = useState('');
	const [guid, setGuid] = useState('');
	const [countdown, setCountdown] = useState('');
	const [canResend, setCanResend] = useState(false);
	const [isResending, setIsResending] = useState(false);
	const [isVerifying, setIsVerifying] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		setOtp('');
		setError(null);
		setCanResend(false);
		setGuid(request?.guid || '');
	}, [request, open]);

	useEffect(() => {
		if (!open) return;
		let remaining = 60;
		setCanResend(false);

		const tick = () => {
			remaining -= 1;
			if (remaining <= 0) {
				setCountdown('00:00');
				setCanResend(true);
				return false;
			}
			const mins = String(Math.floor(remaining / 60)).padStart(2, '0');
			const secs = String(remaining % 60).padStart(2, '0');
			setCountdown(`${mins}:${secs}`);
			return true;
		};

		setCountdown('01:00');
		const timer = setInterval(() => {
			if (!tick()) {
				clearInterval(timer);
			}
		}, 1000);

		return () => clearInterval(timer);
	}, [open]);

	const handleResend = async () => {
		if (!request || !canResend || isResending) return;
		setIsResending(true);
		setError(null);
		try {
			const response = await checkNumberAndSendOtp(request.number, request.iso2);
			if (response === 'exist') {
				setError('This phone number has already been registered.');
			} else if (response) {
				setGuid(String(response));
				setCanResend(false);
			} else {
				setError('Failed to resend OTP. Please try again.');
			}
		} catch {
			setError('Failed to resend OTP. Please try again.');
		} finally {
			setIsResending(false);
		}
	};

	const handleVerify = async () => {
		if (!request || !otp || isVerifying) return;
		setIsVerifying(true);
		setError(null);
		try {
			const response = await verifyOtp(guid, otp, request.iso2);
			if (response === true) {
				onVerified({ ...request, guid });
				return;
			}
			setError('Sorry, the given code is not matched. Please try again.');
		} catch {
			setError('Unable to verify OTP. Please try again.');
		} finally {
			setIsVerifying(false);
		}
	};

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="xs"
			fullWidth
		>
			<DialogTitle>Verify phone number</DialogTitle>
			<DialogContent dividers>
				<Box className="flex flex-col gap-3">
					<Typography variant="body2">
						Enter the 6-digit code sent to your phone.
					</Typography>
					{error && <Alert severity="error">{error}</Alert>}
					<TextField
						label="OTP"
						value={otp}
						onChange={(event) => setOtp(event.target.value)}
						fullWidth
						inputProps={{ maxLength: 6 }}
					/>
					<div className="flex items-center justify-between text-sm">
						<Typography variant="caption">{countdown ? `Resend available in ${countdown}` : ''}</Typography>
						<Button
							variant="text"
							disabled={!canResend || isResending}
							onClick={handleResend}
						>
							Resend OTP
						</Button>
					</div>
				</Box>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose}>Cancel</Button>
				<Button
					variant="contained"
					onClick={handleVerify}
					disabled={!otp || isVerifying}
				>
					{isVerifying ? <CircularProgress size={18} /> : 'Verify'}
				</Button>
			</DialogActions>
		</Dialog>
	);
}

function PersonalSettingsTab({ user, countries, currencies, phoneCodes, supportedCultures }: PersonalSettingsTabProps) {
	const { updateUser } = useUser();
	const { setCultureCode } = useSystemData();
	const profile = (user?.profile || {}) as any;
	const countryId = Number(profile?.Country ?? '');
	const countryCode = (profile?.CountryCode || '').toString();
	const isSubAccount = Boolean(profile?.IsSubAccount);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
	const [isSaving, setIsSaving] = useState(false);
	const [isCultureChanging, setIsCultureChanging] = useState(false);
	const [otpRequest, setOtpRequest] = useState<OtpRequest | null>(null);
	const [otpOpen, setOtpOpen] = useState(false);

	const dialCode = useMemo(() => {
		const phoneInfo = phoneCodes.find((item) => Number(item.Value) === Number(countryId));
		const value = phoneInfo?.ValueText ? String(phoneInfo.ValueText) : '';
		return value.startsWith('+') ? value.slice(1) : value;
	}, [phoneCodes, countryId]);

	const actualPhone = useMemo(() => {
		if (!profile?.PhoneNumber) return '';
		const raw = String(profile.PhoneNumber);
		if (dialCode && raw.startsWith(dialCode)) {
			return raw.slice(dialCode.length);
		}
		if (dialCode && raw.startsWith(`+${dialCode}`)) {
			return raw.slice(dialCode.length + 1);
		}
		return raw;
	}, [profile?.PhoneNumber, dialCode]);

	const actualPhoneDigits = useMemo(() => normalizeDigits(actualPhone).slice(-10), [actualPhone]);

	const selectedLanguage = useMemo(() => {
		const byLanguageId = supportedCultures.find(
			(item) => item.LanguageId !== undefined && Number(item.LanguageId) === Number(profile?.Language)
		);
		if (byLanguageId) return byLanguageId;
		return supportedCultures.find((item) => String(item.Id) === String(profile?.Language));
	}, [supportedCultures, profile?.Language]);

	const defaultValues = useMemo<FormType>(
		() => ({
			firstName: profile?.FirstName || '',
			lastName: profile?.LastName || '',
			email: profile?.Email || user?.email || '',
			phoneNumber: actualPhone || '',
			zip: profile?.Zip || '',
			place: profile?.Place || '',
			state: profile?.State || '',
			country: countryId || '',
			language: (selectedLanguage?.Id as string) || '',
			currency: profile?.Currency || ''
		}),
		[
			profile?.FirstName,
			profile?.LastName,
			profile?.Email,
			profile?.Zip,
			profile?.Place,
			profile?.State,
			profile?.Currency,
			user?.email,
			actualPhone,
			countryId,
			selectedLanguage?.Id
		]
	);

	const { control, handleSubmit, reset, formState } = useForm<FormType>({
		defaultValues,
		mode: 'all',
		resolver: zodResolver(schema)
	});

	const { isValid, dirtyFields, errors } = formState;

	useEffect(() => {
		reset(defaultValues);
	}, [defaultValues, reset]);

	const refreshUser = async (email?: string) => {
		if (!email) return;
		try {
			const response = await getUserInfoByEmail(email);
			if (!response || response === 'unauthorized') return;
			const displayName =
				(response as any)?.FullName ||
				(response as any)?.FirstName ||
				(response as any)?.Email ||
				user?.displayName;
			updateUser({
				profile: response as Record<string, unknown>,
				displayName,
				email: (response as any)?.Email || user?.email
			});
		} catch {
			// ignore refresh errors
		}
	};

	const handleLanguageChange = async (langId: string | number) => {
		const selected = supportedCultures.find((item) => String(item.Id) === String(langId));
		if (!selected) return;
		setIsCultureChanging(true);
		try {
			const payload = { ...profile, Language: selected.LanguageId ?? profile?.Language };
			await updateUserProfile(payload);
			await refreshUser(profile?.Email || user?.email);
			if (selected.Code) {
				await setCultureCode(selected.Code);
			}
		} catch {
			// ignore
		} finally {
			setIsCultureChanging(false);
		}
	};

	const performUpdate = async (
		payload: Record<string, unknown>,
		phoneChanged: boolean,
		formSnapshot?: FormType
	) => {
		setIsSaving(true);
		setSubmitError(null);
		try {
			const response = await updateUserProfile(payload, phoneChanged);
			const success = response === true || response === 1 || response === '1' || response === 'success';
			if (success) {
				setSubmitSuccess('Successfully saved.');
				await refreshUser(profile?.Email || user?.email);
				if (formSnapshot) {
					reset(formSnapshot);
				}
				return;
			}

			const errorMessage = (response as any)?.Message;
			setSubmitError(errorMessage || 'Something went wrong.');
		} catch {
			setSubmitError('Something went wrong.');
		} finally {
			setIsSaving(false);
		}
	};

	const onSubmit = async (formData: FormType) => {
		setSubmitError(null);
		setSubmitSuccess(null);

		const phoneRaw = formData.phoneNumber ? String(formData.phoneNumber).trim() : '';
		const phoneDigits = phoneRaw ? normalizeDigits(phoneRaw).slice(-10) : '';
		const hasExistingPhone = actualPhoneDigits.length > 0;

		if (hasExistingPhone && !phoneDigits) {
			setSubmitError(
				'You cannot remove your phone number. Please update or change it instead.'
			);
			return;
		}

		const phoneChanged = phoneDigits !== actualPhoneDigits;
		const countryCodeLower = countryCode.toLowerCase();

		const payload: Record<string, unknown> = {
			...profile,
			FirstName: formData.firstName?.trim(),
			LastName: formData.lastName?.trim(),
			Email: profile?.Email,
			Country: profile?.Country,
			CountryCode: profile?.CountryCode,
			Place: formData.place || '',
			State: formData.state || '',
			Zip: formData.zip || '',
			Currency: formData.currency,
			Language: selectedLanguage?.LanguageId ?? profile?.Language,
			PhoneNumber: phoneDigits || profile?.PhoneNumber
		};

		if (phoneChanged && countryCodeLower === 'bd') {
			const fullNumber = phoneRaw.startsWith('880') ? phoneRaw : `880${phoneRaw}`;
			if (!validateBangladeshNumber(fullNumber)) {
				setSubmitError('Mobile number invalid.');
				return;
			}

			setIsSaving(true);
			try {
				const response = await checkNumberAndSendOtp(phoneDigits, countryCode.toUpperCase());
				if (response === 'exist') {
					setSubmitError('This phone number has already been registered to jobdesk.'
					);
					return;
				}
				if (!response) {
					setSubmitError('Something went wrong. Please try again.');
					return;
				}
				setOtpRequest({
					guid: String(response),
					number: phoneDigits,
					iso2: countryCode.toUpperCase(),
					payload,
					phoneChanged: true,
					formSnapshot: formData
				});
				setOtpOpen(true);
			} catch {
				setSubmitError('Something went wrong. Please try again.');
			} finally {
				setIsSaving(false);
			}
			return;
		}

		await performUpdate(payload, phoneChanged, formData);
	};

	const handleOtpVerified = async (request: OtpRequest) => {
		setOtpOpen(false);
		setOtpRequest(null);
		await performUpdate(request.payload, request.phoneChanged, request.formSnapshot);
	};

	return (
		<div className="w-full max-w-4xl">
			<form
				onSubmit={handleSubmit(onSubmit)}
				className="flex w-full flex-col gap-6"
			>
				{submitError && <Alert severity="error">{submitError}</Alert>}
				{submitSuccess && <Alert severity="success">{submitSuccess}</Alert>}

				<div className="grid w-full gap-4 sm:grid-cols-2">
					<Controller
						control={control}
						name="firstName"
						render={({ field }) => (
							<FormControl className="w-full">
								<FormLabel htmlFor="firstName">First name</FormLabel>
								<TextField
									{...field}
									id="firstName"
									placeholder="First name"
									required
									error={!!errors.firstName}
									helperText={errors?.firstName?.message}
								/>
							</FormControl>
						)}
					/>
					<Controller
						control={control}
						name="lastName"
						render={({ field }) => (
							<FormControl className="w-full">
								<FormLabel htmlFor="lastName">Last name</FormLabel>
								<TextField
									{...field}
									id="lastName"
									placeholder="Last name"
									required
									error={!!errors.lastName}
									helperText={errors?.lastName?.message}
								/>
							</FormControl>
						)}
					/>
					<Controller
						control={control}
						name="email"
						render={({ field }) => (
							<FormControl className="w-full">
								<FormLabel htmlFor="email">Email</FormLabel>
								<TextField
									{...field}
									id="email"
									type="email"
									placeholder="Email"
									disabled
									fullWidth
								/>
							</FormControl>
						)}
					/>
					<Controller
						control={control}
						name="phoneNumber"
						render={({ field }) => (
							<FormControl className="w-full">
								<FormLabel htmlFor="phoneNumber">Phone number</FormLabel>
								<TextField
									{...field}
									id="phoneNumber"
									placeholder="Phone number"
									InputProps={{
										startAdornment: (
											<InputAdornment position="start">
												<Box className="flex items-center gap-2">
													{countryCode && (
														<span>{getFlagEmoji(countryCode)}</span>
													)}
													<Typography variant="body2">+{dialCode || '--'}</Typography>
												</Box>
											</InputAdornment>
										),
										endAdornment: profile?.PhoneNumberConfirmed ? (
											<InputAdornment position="end">
												<FuseSvgIcon
													color="success"
													size={18}
												>
													lucide:badge-check
												</FuseSvgIcon>
											</InputAdornment>
										) : null
									}}
								/>
							</FormControl>
						)}
					/>
					<Controller
						control={control}
						name="zip"
						render={({ field }) => (
							<FormControl className="w-full">
								<FormLabel htmlFor="zip">ZIP</FormLabel>
								<TextField
									{...field}
									id="zip"
									placeholder="ZIP"
								/>
							</FormControl>
						)}
					/>
					<Controller
						control={control}
						name="place"
						render={({ field }) => (
							<FormControl className="w-full">
								<FormLabel htmlFor="place">Place</FormLabel>
								<TextField
									{...field}
									id="place"
									placeholder="Place"
								/>
							</FormControl>
						)}
					/>
					<Controller
						control={control}
						name="state"
						render={({ field }) => (
							<FormControl className="w-full">
								<FormLabel htmlFor="state">State</FormLabel>
								<TextField
									{...field}
									id="state"
									placeholder="State"
								/>
							</FormControl>
						)}
					/>
					<Controller
						control={control}
						name="country"
						render={({ field }) => (
							<FormControl className="w-full">
								<FormLabel htmlFor="country">Country</FormLabel>
								<Select
									{...field}
									disabled
									value={field.value ?? ''}
									id="country"
								>
									{countries.map((item) => (
										<MenuItem
											key={item.Value}
											value={item.Value}
										>
											{item.Name || item.ValueText}
										</MenuItem>
									))}
								</Select>
							</FormControl>
						)}
					/>
					<div className="flex items-center gap-2">
						<Controller
							control={control}
							name="language"
							render={({ field }) => (
								<FormControl className="w-full">
									<FormLabel htmlFor="language">Language</FormLabel>
									<Select
										{...field}
										id="language"
										onChange={(event) => {
											field.onChange(event);
											handleLanguageChange(event.target.value as string);
										}}
									>
										{supportedCultures.map((item) => (
											<MenuItem
												key={item.Id}
												value={item.Id || ''}
											>
												{item.NativeName || item.Title || item.Code || item.Id}
											</MenuItem>
										))}
									</Select>
								</FormControl>
							)}
						/>
						{isCultureChanging && <CircularProgress size={18} />}
					</div>
					<Controller
						control={control}
						name="currency"
						render={({ field }) => (
							<FormControl className="w-full">
								<FormLabel htmlFor="currency">Currency</FormLabel>
								<Select
									{...field}
									id="currency"
									disabled={isSubAccount}
									error={!!errors.currency}
								>
									{currencies.map((item) => (
										<MenuItem
											key={item.Value}
											value={item.Name || item.ValueText}
										>
											{item.Name || item.ValueText}
										</MenuItem>
									))}
								</Select>
								{errors.currency && (
									<Typography
										variant="caption"
										color="error"
									>
										{errors.currency.message}
									</Typography>
								)}
							</FormControl>
						)}
					/>
				</div>

				<div className="flex items-center justify-end gap-2">
					<Button
						variant="outlined"
						disabled={isSaving || _.isEmpty(dirtyFields)}
						onClick={() => reset(defaultValues)}
					>
						Cancel
					</Button>
					<Button
						variant="contained"
						type="submit"
						disabled={isSaving || _.isEmpty(dirtyFields) || !isValid}
						startIcon={isSaving ? <CircularProgress size={18} color="inherit" /> : null}
					>
						Save
					</Button>
				</div>
			</form>

			<OtpDialog
				open={otpOpen}
				request={otpRequest}
				onClose={() => setOtpOpen(false)}
				onVerified={handleOtpVerified}
			/>
		</div>
	);
}

export default PersonalSettingsTab;
