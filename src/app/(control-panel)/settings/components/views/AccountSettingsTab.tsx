'use client';

import { useEffect, useMemo, useState } from 'react';
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
	FormControlLabel,
	FormLabel,
	Switch,
	TextField,
	Typography
} from '@mui/material';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import useUser from '@auth/useUser';
import { User } from '@auth/user';
import { TypeInfoItem } from '@/api/services/typeInfos';
import { changePassword, enableOrDisable2FA, verifyIdentity } from '@/api/services/userSettings';
import { getUserInfoByEmail } from '@/api/services/user';

type AccountSettingsTabProps = {
	user: User;
	countries: TypeInfoItem[];
};

type TwoFactorInfo = {
	QRUrl?: string;
	Key?: string;
};

const passwordSchema = z
	.object({
		currentPassword: z.string().min(1, 'Current password is required'),
		newPassword: z.string().min(1, 'New password is required'),
		confirmPassword: z.string().min(1, 'Confirm password is required')
	})
	.refine((data) => data.newPassword === data.confirmPassword, {
		message: 'Passwords do not match',
		path: ['confirmPassword']
	});

type PasswordForm = z.infer<typeof passwordSchema>;

function formatQrKey(key?: string) {
	if (!key) return '';
	try {
		return key.match(/.{1,7}/g)?.join('-') || key;
	} catch {
		return key;
	}
}

function getFlagEmoji(code?: string) {
	if (!code) return '';
	const upper = code.trim().toUpperCase();
	if (upper.length !== 2) return '';
	const charCodes = [...upper].map((char) => 127397 + char.charCodeAt(0));
	return String.fromCodePoint(...charCodes);
}

function formatDate(value: string) {
	const date = new Date(value);
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

function ChangePasswordDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const { control, handleSubmit, reset, formState } = useForm<PasswordForm>({
		defaultValues: {
			currentPassword: '',
			newPassword: '',
			confirmPassword: ''
		},
		mode: 'all',
		resolver: zodResolver(passwordSchema)
	});

	const { isValid, errors, dirtyFields } = formState;

	const onSubmit = async (formData: PasswordForm) => {
		setIsSubmitting(true);
		setSubmitError(null);

		try {
			const response = await changePassword({
				OldPassword: formData.currentPassword,
				NewPassword: formData.newPassword,
				ConfirmPassword: formData.confirmPassword
			});

			if (response === 1) {
				setSubmitError('Current password is wrong.');
				return;
			}
			if (response === 2) {
				reset();
				onClose();
				return;
			}
			setSubmitError('Something went wrong.');
		} catch {
			setSubmitError('Something went wrong.');
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="xs"
			fullWidth
		>
			<DialogTitle>Change password</DialogTitle>
			<DialogContent dividers>
				<Box className="flex flex-col gap-4">
					{submitError && <Alert severity="error">{submitError}</Alert>}
					<Controller
						name="currentPassword"
						control={control}
						render={({ field }) => (
							<FormControl className="w-full">
								<FormLabel htmlFor="currentPassword">Current password</FormLabel>
								<TextField
									{...field}
									id="currentPassword"
									type="password"
									error={!!errors.currentPassword}
									helperText={errors?.currentPassword?.message}
									fullWidth
								/>
							</FormControl>
						)}
					/>
					<Controller
						name="newPassword"
						control={control}
						render={({ field }) => (
							<FormControl className="w-full">
								<FormLabel htmlFor="newPassword">New password</FormLabel>
								<TextField
									{...field}
									id="newPassword"
									type="password"
									error={!!errors.newPassword}
									helperText={errors?.newPassword?.message}
									fullWidth
								/>
							</FormControl>
						)}
					/>
					<Controller
						name="confirmPassword"
						control={control}
						render={({ field }) => (
							<FormControl className="w-full">
								<FormLabel htmlFor="confirmPassword">Confirm password</FormLabel>
								<TextField
									{...field}
									id="confirmPassword"
									type="password"
									error={!!errors.confirmPassword}
									helperText={errors?.confirmPassword?.message}
									fullWidth
								/>
							</FormControl>
						)}
					/>
				</Box>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose}>Cancel</Button>
				<Button
					variant="contained"
					onClick={handleSubmit(onSubmit)}
					disabled={!isValid || isSubmitting || Object.keys(dirtyFields).length === 0}
				>
					{isSubmitting ? <CircularProgress size={18} /> : 'Update'}
				</Button>
			</DialogActions>
		</Dialog>
	);
}

function IdentityVerifyDialog({
	open,
	onClose,
	onSuccess
}: {
	open: boolean;
	onClose: () => void;
	onSuccess: () => void;
}) {
	const [fullName, setFullName] = useState('');
	const [birthDate, setBirthDate] = useState('');
	const [nidFile, setNidFile] = useState<File | null>(null);
	const [selfieFile, setSelfieFile] = useState<File | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!open) return;
		setError(null);
		setIsSubmitting(false);
	}, [open]);

	const handleSubmit = async () => {
		if (!nidFile || !selfieFile) {
			setError('Please provide both NID and selfie images.');
			return;
		}
		if (!birthDate) {
			setError('Please provide your birth date.');
			return;
		}

		setIsSubmitting(true);
		setError(null);
		try {
			const response = await verifyIdentity({
				nid: nidFile,
				selfie: selfieFile,
				name: fullName || ' ',
				identityType: 1,
				birthDate: formatDate(birthDate)
			});

			if (response === 'success' || response === true) {
				onSuccess();
				return;
			}
			if (response === 'date') {
				setError('Birth date is invalid.');
				return;
			}
			if (response === 'image') {
				setError('Image validation failed. Please try again.');
				return;
			}
			setError('Something went wrong.');
		} catch {
			setError('Something went wrong.');
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="xs"
			fullWidth
		>
			<DialogTitle>Verify identity</DialogTitle>
			<DialogContent dividers>
				<Box className="flex flex-col gap-4">
					{error && <Alert severity="error">{error}</Alert>}
					<TextField
						label="Full name"
						value={fullName}
						onChange={(event) => setFullName(event.target.value)}
						fullWidth
					/>
					<TextField
						label="Birth date"
						type="date"
						value={birthDate}
						onChange={(event) => setBirthDate(event.target.value)}
						InputLabelProps={{ shrink: true }}
						fullWidth
					/>
					<div className="flex flex-col gap-2">
						<Typography variant="body2">NID image</Typography>
						<input
							type="file"
							accept="image/*"
							onChange={(event) => setNidFile(event.target.files?.[0] || null)}
						/>
					</div>
					<div className="flex flex-col gap-2">
						<Typography variant="body2">Selfie image</Typography>
						<input
							type="file"
							accept="image/*"
							onChange={(event) => setSelfieFile(event.target.files?.[0] || null)}
						/>
					</div>
				</Box>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose}>Cancel</Button>
				<Button
					variant="contained"
					onClick={handleSubmit}
					disabled={isSubmitting}
				>
					{isSubmitting ? <CircularProgress size={18} /> : 'Submit'}
				</Button>
			</DialogActions>
		</Dialog>
	);
}

function AccountSettingsTab({ user, countries }: AccountSettingsTabProps) {
	const { updateUser } = useUser();
	const profile = (user?.profile || {}) as any;
	const countryName = useMemo(() => {
		const match = countries.find((item) => Number(item.Value) === Number(profile?.Country));
		return match?.Name || '';
	}, [countries, profile?.Country]);
	const countryCode = useMemo(() => {
		const match = countries.find((item) => Number(item.Value) === Number(profile?.Country));
		return match?.ValueText || profile?.CountryCode || '';
	}, [countries, profile?.Country, profile?.CountryCode]);

	const [twoFactorEnabled, setTwoFactorEnabled] = useState(Boolean(profile?.TwoFactorEnabled));
	const [twoFactorBusy, setTwoFactorBusy] = useState(false);
	const [twoFactorInfo, setTwoFactorInfo] = useState<TwoFactorInfo | null>(null);
	const [showTwoFactorInfo, setShowTwoFactorInfo] = useState(false);
	const [showTwoFactorHelp, setShowTwoFactorHelp] = useState(false);
	const [showDataLocationHelp, setShowDataLocationHelp] = useState(false);
	const [showPasswordDialog, setShowPasswordDialog] = useState(false);
	const [showIdentityDialog, setShowIdentityDialog] = useState(false);
	const [alert, setAlert] = useState<{ severity: 'success' | 'error'; message: string } | null>(null);

	useEffect(() => {
		setTwoFactorEnabled(Boolean(profile?.TwoFactorEnabled));
	}, [profile?.TwoFactorEnabled]);

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
			// ignore
		}
	};

	const handleToggle2FA = async (checked: boolean) => {
		if (twoFactorBusy) return;
		setTwoFactorBusy(true);
		setAlert(null);
		try {
			const response = await enableOrDisable2FA(checked);
			if (response) {
				setTwoFactorEnabled(checked);
				setAlert({
					severity: 'success',
					message: checked
						? 'Two-factor authentication has been enabled.'
						: 'Two-factor authentication has been disabled.'
				});
				if (checked) {
					setTwoFactorInfo(response as TwoFactorInfo);
					setShowTwoFactorInfo(true);
				}
				await refreshUser(profile?.Email || user?.email);
			} else {
				setAlert({
					severity: 'error',
					message: checked
						? 'Failed to enable two-factor authentication.'
						: 'Failed to disable two-factor authentication.'
				});
			}
		} catch {
			setAlert({
				severity: 'error',
				message: checked
					? 'Failed to enable two-factor authentication.'
					: 'Failed to disable two-factor authentication.'
			});
		} finally {
			setTwoFactorBusy(false);
		}
	};

	const handleCopyKey = async () => {
		const key = profile?.TwoFactorKey || twoFactorInfo?.Key;
		if (!key) return;
		try {
			await navigator.clipboard.writeText(key);
			setAlert({ severity: 'success', message: 'Copied to clipboard.' });
		} catch {
			setAlert({ severity: 'error', message: 'Failed to copy key.' });
		}
	};

	const twoFactorHelpHtml = `
		<h2>Account settings</h2>
		<p><strong>2FA</strong> is two-factor authentication, a security process that requires a second factor to verify your login.</p>
		<p>If you turn <strong>ON</strong> 2FA, you will be asked to scan a QR code using Google Authenticator or Microsoft Authenticator. You will then enter the code from your phone every time you log in.</p>
		<p>If you turn <strong>OFF</strong> 2FA, you will not be asked for the extra code on login.</p>
	`;

	const dataLocationHtml = `
		<h2>Physical data location</h2>
		<p>All data are physically stored inside the country shown here.</p>
		<p><strong>Note:</strong> Some countries require that sensitive information be stored locally.</p>
	`;

	return (
		<div className="w-full max-w-4xl">
			<div className="flex flex-col gap-6">
				{alert && <Alert severity={alert.severity}>{alert.message}</Alert>}

				<div className="rounded-xl border border-divider p-4">
					<div className="flex items-center justify-between">
						<div className="flex flex-col gap-1">
							<Typography className="text-lg font-medium">Enable 2FA</Typography>
							<Typography color="text.secondary">
								Protect your account with two-factor authentication.
							</Typography>
						</div>
						<div className="flex items-center gap-2">
							<Button
								variant="text"
								onClick={() => setShowTwoFactorHelp(true)}
								startIcon={<FuseSvgIcon size={18}>lucide:help-circle</FuseSvgIcon>}
							>
								Help
							</Button>
							{twoFactorBusy ? (
								<CircularProgress size={20} />
							) : (
								<FormControlLabel
									control={
										<Switch
											checked={twoFactorEnabled}
											onChange={(event) => handleToggle2FA(event.target.checked)}
										/>
									}
									label={twoFactorEnabled ? 'On' : 'Off'}
									labelPlacement="start"
								/>
							)}
						</div>
					</div>
					{twoFactorEnabled && (profile?.TwoFactorKey || twoFactorInfo?.Key) && (
						<div className="mt-4 flex flex-col gap-2">
							<Typography variant="body2">2FA Key:</Typography>
							<div className="flex items-center gap-2">
								<Typography
									className="cursor-pointer"
									onClick={handleCopyKey}
								>
									{formatQrKey(profile?.TwoFactorKey || twoFactorInfo?.Key)}
								</Typography>
								<Button
									variant="text"
									onClick={handleCopyKey}
									startIcon={<FuseSvgIcon size={18}>lucide:copy</FuseSvgIcon>}
								>
									Copy
								</Button>
							</div>
						</div>
					)}
				</div>

				<div className="rounded-xl border border-divider p-4">
					<div className="flex items-center justify-between">
						<div className="flex flex-col gap-1">
							<Typography className="text-lg font-medium">Change password</Typography>
							<Typography color="text.secondary">
								Update your account password.
							</Typography>
						</div>
						<Button
							variant="outlined"
							startIcon={<FuseSvgIcon>lucide:key</FuseSvgIcon>}
							onClick={() => setShowPasswordDialog(true)}
						>
							Change
						</Button>
					</div>
				</div>

				<div className="rounded-xl border border-divider p-4">
					<div className="flex items-center justify-between">
						<div className="flex flex-col gap-1">
							<Typography className="text-lg font-medium">Your data location</Typography>
							<Typography color="text.secondary">
								Physical data location for your account.
							</Typography>
						</div>
						<div className="flex items-center gap-2">
							<Button
								variant="text"
								onClick={() => setShowDataLocationHelp(true)}
								startIcon={<FuseSvgIcon size={18}>lucide:help-circle</FuseSvgIcon>}
							>
								Help
							</Button>
							<Typography>
								{countryName} {getFlagEmoji(countryCode)}
							</Typography>
						</div>
					</div>
				</div>

				<div className="rounded-xl border border-divider p-4">
					<div className="flex items-center justify-between">
						<div className="flex flex-col gap-1">
							<Typography className="text-lg font-medium">Verify your identity</Typography>
							<Typography color="text.secondary">
								Submit identity documents for verification.
							</Typography>
						</div>
						{profile?.IdentityVerified ? (
							<Button
								variant="outlined"
								disabled
							>
								Verified
							</Button>
						) : (
							<Button
								variant="outlined"
								onClick={() => setShowIdentityDialog(true)}
							>
								Verify
							</Button>
						)}
					</div>
					{profile?.IdentityVerified && (
						<div className="mt-3 rounded-lg bg-green-50 px-3 py-2">
							<Typography color="success.main">You are already verified.</Typography>
						</div>
					)}
				</div>
			</div>

			<Dialog
				open={showTwoFactorInfo}
				onClose={() => setShowTwoFactorInfo(false)}
				maxWidth="xs"
				fullWidth
			>
				<DialogTitle>2FA setup</DialogTitle>
				<DialogContent dividers>
					<Box className="flex flex-col items-center gap-3">
						{twoFactorInfo?.QRUrl && (
							<img
								src={twoFactorInfo.QRUrl}
								alt="2FA QR"
								className="h-40 w-40"
							/>
						)}
						{twoFactorInfo?.Key && (
							<Typography>{formatQrKey(twoFactorInfo.Key)}</Typography>
						)}
					</Box>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setShowTwoFactorInfo(false)}>Close</Button>
				</DialogActions>
			</Dialog>

			<Dialog
				open={showTwoFactorHelp}
				onClose={() => setShowTwoFactorHelp(false)}
				maxWidth="sm"
				fullWidth
			>
				<DialogTitle>2FA Help</DialogTitle>
				<DialogContent dividers>
					<div dangerouslySetInnerHTML={{ __html: twoFactorHelpHtml }} />
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setShowTwoFactorHelp(false)}>Close</Button>
				</DialogActions>
			</Dialog>

			<Dialog
				open={showDataLocationHelp}
				onClose={() => setShowDataLocationHelp(false)}
				maxWidth="sm"
				fullWidth
			>
				<DialogTitle>Data location</DialogTitle>
				<DialogContent dividers>
					<div dangerouslySetInnerHTML={{ __html: dataLocationHtml }} />
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setShowDataLocationHelp(false)}>Close</Button>
				</DialogActions>
			</Dialog>

			<ChangePasswordDialog
				open={showPasswordDialog}
				onClose={() => setShowPasswordDialog(false)}
			/>

			<IdentityVerifyDialog
				open={showIdentityDialog}
				onClose={() => setShowIdentityDialog(false)}
				onSuccess={() => {
					setShowIdentityDialog(false);
					setAlert({ severity: 'success', message: 'Identity verification submitted.' });
				}}
			/>
		</div>
	);
}

export default AccountSettingsTab;

