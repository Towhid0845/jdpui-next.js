'use client';

import { useEffect, useState } from 'react';
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
	IconButton,
	MenuItem,
	Select,
	Switch,
	TextField,
	Typography
} from '@mui/material';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { User } from '@auth/user';
import { TypeInfoItem } from '@/api/services/typeInfos';
import {
	changeSubUserType,
	createSubUser,
	deleteSubUser,
	getAllSubUsers,
	lockUnlockSubUser
} from '@/api/services/userSettings';

type UsersSettingsTabProps = {
	user: User;
	userTypes: TypeInfoItem[];
};

type SubUser = {
	FirstName?: string;
	LastName?: string;
	Email?: string;
	UserType?: number;
	IsActive?: boolean;
	Rid?: number;
};

const addUserSchema = z.object({
	firstName: z.string().optional(),
	lastName: z.string().optional(),
	email: z.string().email('Valid email is required'),
	role: z.string().min(1, 'Role is required')
});

type AddUserForm = z.infer<typeof addUserSchema>;

function ConfirmDialog({
	open,
	title,
	message,
	onClose,
	onConfirm
}: {
	open: boolean;
	title: string;
	message: string;
	onClose: () => void;
	onConfirm: () => void;
}) {
	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="xs"
			fullWidth
		>
			<DialogTitle>{title}</DialogTitle>
			<DialogContent dividers>
				<Typography variant="body2">{message}</Typography>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose}>Cancel</Button>
				<Button
					variant="contained"
					color="error"
					onClick={onConfirm}
				>
					Confirm
				</Button>
			</DialogActions>
		</Dialog>
	);
}

function AddUserDialog({
	open,
	onClose,
	userTypes,
	onSuccess
}: {
	open: boolean;
	onClose: () => void;
	userTypes: TypeInfoItem[];
	onSuccess: () => void;
}) {
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const { control, handleSubmit, reset, formState } = useForm<AddUserForm>({
		defaultValues: {
			firstName: '',
			lastName: '',
			email: '',
			role: ''
		},
		mode: 'all',
		resolver: zodResolver(addUserSchema)
	});

	const { isValid, errors, dirtyFields } = formState;

	const onSubmit = async (formData: AddUserForm) => {
		setIsSubmitting(true);
		setSubmitError(null);
		try {
			const response = await createSubUser({
				FirstName: formData.firstName,
				LastName: formData.lastName,
				Email: formData.email,
				Role: Number(formData.role)
			});

			if (response === 1) {
				setSubmitError('An account with this email already exists.');
				return;
			}
			if (response === 3) {
				reset();
				onSuccess();
				return;
			}
			if (response === 4) {
				setSubmitError('User limit exceeded.');
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
			<DialogTitle>Add user</DialogTitle>
			<DialogContent dividers>
				<Box className="flex flex-col gap-4">
					{submitError && <Alert severity="error">{submitError}</Alert>}
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
									error={!!errors.email}
									helperText={errors?.email?.message}
									fullWidth
								/>
							</FormControl>
						)}
					/>
					<Controller
						control={control}
						name="role"
						render={({ field }) => (
							<FormControl className="w-full">
								<FormLabel htmlFor="role">Role</FormLabel>
								<Select
									{...field}
									id="role"
									error={!!errors.role}
								>
									{userTypes.map((item) => (
										<MenuItem
											key={item.Value}
											value={String(item.Value)}
										>
											{item.Name || item.ValueText}
										</MenuItem>
									))}
								</Select>
								{errors.role && (
									<Typography
										variant="caption"
										color="error"
									>
										{errors.role.message}
									</Typography>
								)}
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
					{isSubmitting ? <CircularProgress size={18} /> : 'Add'}
				</Button>
			</DialogActions>
		</Dialog>
	);
}

function UsersSettingsTab({ user, userTypes }: UsersSettingsTabProps) {
	const profile = (user?.profile || {}) as any;
	const [subUsers, setSubUsers] = useState<SubUser[]>([]);
	const [loading, setLoading] = useState(false);
	const [alert, setAlert] = useState<{ severity: 'success' | 'error'; message: string } | null>(null);
	const [actionEmail, setActionEmail] = useState<string | null>(null);
	const [confirmState, setConfirmState] = useState<{
		open: boolean;
		title: string;
		message: string;
		onConfirm: () => void;
	}>({ open: false, title: '', message: '', onConfirm: () => {} });
	const [addDialogOpen, setAddDialogOpen] = useState(false);

	const canManageUsers = !profile?.IsSubAccount;

	const loadSubUsers = async () => {
		setLoading(true);
		try {
			const response = await getAllSubUsers();
			setSubUsers(Array.isArray(response) ? response : []);
		} catch {
			setAlert({ severity: 'error', message: 'Failed to load users.' });
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadSubUsers();
	}, []);

	const handleChangeUserType = async (subUser: SubUser, value: number) => {
		setActionEmail(subUser.Email || null);
		setAlert(null);
		try {
			const response = await changeSubUserType({
				Email: subUser.Email,
				Rid: subUser.Rid,
				Type: value
			});
			if (response === 1) {
				setSubUsers((prev) =>
					prev.map((item) =>
						item.Email === subUser.Email ? { ...item, UserType: value } : item
					)
				);
				setAlert({ severity: 'success', message: 'User type updated.' });
			} else {
				setAlert({ severity: 'error', message: 'Could not update user type.' });
			}
		} catch {
			setAlert({ severity: 'error', message: 'Could not update user type.' });
		} finally {
			setActionEmail(null);
		}
	};

	const runToggleUser = async (subUser: SubUser, isActive: boolean) => {
		setActionEmail(subUser.Email || null);
		try {
			const response = await lockUnlockSubUser({
				Email: subUser.Email,
				IsActive: isActive
			});
			if (response === 1) {
				await loadSubUsers();
				setAlert({
					severity: 'success',
					message: isActive ? 'User activated.' : 'User deactivated.'
				});
			} else if (response === 4) {
				setAlert({
					severity: 'error',
					message: 'User limit exceeded.'
				});
			} else {
				setAlert({ severity: 'error', message: 'Failed to update user status.' });
			}
		} catch {
			setAlert({ severity: 'error', message: 'Failed to update user status.' });
		} finally {
			setActionEmail(null);
		}
	};

	const handleToggleUser = (subUser: SubUser, isActive: boolean) => {
		if (!isActive) {
			setConfirmState({
				open: true,
				title: 'Deactivate user',
				message: 'This user will be deactivated.',
				onConfirm: () => {
					setConfirmState((prev) => ({ ...prev, open: false }));
					runToggleUser(subUser, isActive);
				}
			});
			return;
		}

		runToggleUser(subUser, isActive);
	};

	const handleDeleteUser = (subUser: SubUser) => {
		setConfirmState({
			open: true,
			title: 'Delete user',
			message: 'This user will be deleted.',
			onConfirm: async () => {
				setConfirmState((prev) => ({ ...prev, open: false }));
				setActionEmail(subUser.Email || null);
				try {
					const response = await deleteSubUser({ Email: subUser.Email });
					if (response === 1) {
						await loadSubUsers();
						setAlert({ severity: 'success', message: 'User removed.' });
					} else {
						setAlert({ severity: 'error', message: 'Failed to remove user.' });
					}
				} catch {
					setAlert({ severity: 'error', message: 'Failed to remove user.' });
				} finally {
					setActionEmail(null);
				}
			}
		});
	};

	return (
		<div className="flex flex-col gap-4">
			{alert && <Alert severity={alert.severity}>{alert.message}</Alert>}
			<div className="flex items-center justify-between">
				<Typography className="text-lg font-medium">Users</Typography>
				{canManageUsers && (
					<Button
						variant="outlined"
						startIcon={<FuseSvgIcon>lucide:user-plus</FuseSvgIcon>}
						onClick={() => setAddDialogOpen(true)}
					>
						Add user
					</Button>
				)}
			</div>

			{loading ? (
				<div className="flex items-center justify-center p-6">
					<CircularProgress />
				</div>
			) : subUsers.length === 0 ? (
				<div className="flex flex-col items-center gap-2 py-6">
					<Typography color="text.secondary">No sub users. Add one...</Typography>
					{canManageUsers && (
						<IconButton onClick={() => setAddDialogOpen(true)}>
							<FuseSvgIcon>lucide:user-plus</FuseSvgIcon>
						</IconButton>
					)}
				</div>
			) : (
				<div className="flex flex-col divide-y rounded-xl border border-divider">
					{subUsers.map((subUser) => {
						const displayName = `${subUser.FirstName || ''} ${subUser.LastName || ''}`.trim();
						const isBusy = actionEmail === subUser.Email;
						return (
							<div
								key={subUser.Email}
								className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between"
							>
								<div className="flex flex-col">
									<Typography className="font-medium">{displayName || subUser.Email}</Typography>
									<Typography color="text.secondary">{subUser.Email}</Typography>
								</div>
								<div className="flex flex-wrap items-center gap-3">
									<FormControl size="small">
										<Select
											value={subUser.UserType ?? ''}
											disabled={isBusy}
											onChange={(event) =>
												handleChangeUserType(subUser, Number(event.target.value))
											}
										>
											{userTypes.map((type) => (
												<MenuItem
													key={type.Value}
													value={type.Value}
												>
													{type.Name || type.ValueText}
												</MenuItem>
											))}
										</Select>
									</FormControl>
									<FormControlLabel
										control={
											<Switch
												checked={!!subUser.IsActive}
												disabled={isBusy}
												onChange={(event) =>
													handleToggleUser(subUser, event.target.checked)
												}
											/>
										}
										label={subUser.IsActive ? 'Active' : 'Inactive'}
										labelPlacement="start"
									/>
									{canManageUsers && (
										<IconButton
											onClick={() => handleDeleteUser(subUser)}
											disabled={isBusy}
										>
											<FuseSvgIcon>lucide:trash</FuseSvgIcon>
										</IconButton>
									)}
									{isBusy && <CircularProgress size={20} />}
								</div>
							</div>
						);
					})}
				</div>
			)}

			<ConfirmDialog
				open={confirmState.open}
				title={confirmState.title}
				message={confirmState.message}
				onClose={() => setConfirmState((prev) => ({ ...prev, open: false }))}
				onConfirm={confirmState.onConfirm}
			/>

			<AddUserDialog
				open={addDialogOpen}
				onClose={() => setAddDialogOpen(false)}
				userTypes={userTypes}
				onSuccess={() => {
					setAddDialogOpen(false);
					loadSubUsers();
					setAlert({ severity: 'success', message: 'User successfully added.' });
				}}
			/>
		</div>
	);
}

export default UsersSettingsTab;

