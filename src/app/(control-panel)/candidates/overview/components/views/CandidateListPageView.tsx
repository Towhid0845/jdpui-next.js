'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import FusePageSimple from '@fuse/core/FusePageSimple';
import FuseLoading from '@fuse/core/FuseLoading';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { styled } from '@mui/material/styles';
import {
	Alert,
	Avatar,
	Box,
	Button,
	Chip,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControl,
	FormLabel,
	IconButton,
	InputBase,
	Menu,
	MenuItem,
	Paper,
	Select,
	TextField,
	Typography
} from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import useUser from '@auth/useUser';
import useThemeMediaQuery from '@fuse/hooks/useThemeMediaQuery';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import {
	CandidateItem,
	getCandidatesList,
	getCandidateStatuses,
	deleteCandidate,
	createCandidate,
	inviteCandidateToOpenAccount
} from '@/api/services/candidates';

const Root = styled(FusePageSimple)(({ theme }) => ({
	'& .FusePageSimple-header': {
		backgroundColor: theme.vars.palette.background.paper,
		borderBottomWidth: 1,
		borderStyle: 'solid',
		borderColor: theme.vars.palette.divider
	},
	'& .FusePageSimple-contentWrapper': {
		paddingTop: theme.spacing(2)
	}
}));

const addCandidateSchema = z.object({
	firstName: z.string().min(1, 'First name is required'),
	lastName: z.string().min(1, 'Last name is required'),
	email: z.string().email('Valid email is required'),
	phone: z.string().optional()
});

type AddCandidateForm = z.infer<typeof addCandidateSchema>;

function AddCandidateDialog({
	open,
	onClose,
	onSuccess
}: {
	open: boolean;
	onClose: () => void;
	onSuccess: () => void;
}) {
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const { control, handleSubmit, reset, formState } = useForm<AddCandidateForm>({
		defaultValues: { firstName: '', lastName: '', email: '', phone: '' },
		mode: 'all',
		resolver: zodResolver(addCandidateSchema)
	});

	const { isValid, errors } = formState;

	useEffect(() => {
		if (open) {
			reset();
			setSubmitError(null);
		}
	}, [open, reset]);

	const onSubmit = async (formData: AddCandidateForm) => {
		setIsSubmitting(true);
		setSubmitError(null);
		try {
			const response = await createCandidate({
				FirstName: formData.firstName,
				LastName: formData.lastName,
				Email: formData.email,
				Phone: formData.phone || undefined
			});

			if (response && typeof response === 'object' && (response as Record<string, unknown>)?.Cid) {
				onSuccess();
				return;
			}

			if (response === 1 || response === true) {
				onSuccess();
				return;
			}

			setSubmitError('Something went wrong.');
		} catch {
			setSubmitError('Failed to add candidate.');
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
			<DialogTitle>Add Candidate</DialogTitle>
			<DialogContent dividers>
				<Box className="flex flex-col gap-4">
					{submitError && <Alert severity="error">{submitError}</Alert>}
					<Controller
						control={control}
						name="firstName"
						render={({ field }) => (
							<FormControl className="w-full">
								<FormLabel>First name</FormLabel>
								<TextField
									{...field}
									error={!!errors.firstName}
									helperText={errors.firstName?.message}
									fullWidth
								/>
							</FormControl>
						)}
					/>
					<Controller
						control={control}
						name="lastName"
						render={({ field }) => (
							<FormControl className="w-full">
								<FormLabel>Last name</FormLabel>
								<TextField
									{...field}
									error={!!errors.lastName}
									helperText={errors.lastName?.message}
									fullWidth
								/>
							</FormControl>
						)}
					/>
					<Controller
						control={control}
						name="email"
						render={({ field }) => (
							<FormControl className="w-full">
								<FormLabel>Email</FormLabel>
								<TextField
									{...field}
									type="email"
									error={!!errors.email}
									helperText={errors.email?.message}
									fullWidth
								/>
							</FormControl>
						)}
					/>
					<Controller
						control={control}
						name="phone"
						render={({ field }) => (
							<FormControl className="w-full">
								<FormLabel>Phone (optional)</FormLabel>
								<TextField
									{...field}
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
					disabled={!isValid || isSubmitting}
				>
					{isSubmitting ? <CircularProgress size={18} /> : 'Add'}
				</Button>
			</DialogActions>
		</Dialog>
	);
}

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

function formatDate(value?: string) {
	if (!value) return '—';

	try {
		const d = new Date(value);
		return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
	} catch {
		return value;
	}
}

function CandidateListPageView() {
	const { isReady } = useUser();
	const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down('lg'));
	const { enqueueSnackbar } = useSnackbar();
	const queryClient = useQueryClient();

	const [searchText, setSearchText] = useState('');
	const [statusFilter, setStatusFilter] = useState<number>(0);
	const [pageNumber, setPageNumber] = useState(0);
	const [pageSize] = useState(10);
	const [addDialogOpen, setAddDialogOpen] = useState(false);
	const [actionLoading, setActionLoading] = useState<number | null>(null);
	const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
	const [menuCandidate, setMenuCandidate] = useState<CandidateItem | null>(null);
	const [confirmState, setConfirmState] = useState<{
		open: boolean;
		title: string;
		message: string;
		onConfirm: () => void;
	}>({ open: false, title: '', message: '', onConfirm: () => {} });

	const listPayload = useMemo(
		() => ({
			PageSize: pageSize,
			PageNumber: pageNumber + 1,
			Filters: {
				AvailabilityStatus: statusFilter || undefined,
				SearchText: searchText || undefined
			}
		}),
		[pageSize, pageNumber, statusFilter, searchText]
	);

	const {
		data: candidateData,
		isLoading,
		error
	} = useQuery({
		queryKey: ['candidates-list', listPayload],
		queryFn: () => getCandidatesList(listPayload),
		enabled: isReady
	});

	const { data: statuses } = useQuery({
		queryKey: ['candidate-statuses'],
		queryFn: getCandidateStatuses,
		enabled: isReady
	});

	const candidates = useMemo(() => candidateData?.Result || [], [candidateData]);
	const totalItems = candidateData?.Paging?.TotalItems || 0;
	const totalPages = Math.ceil(totalItems / pageSize);

	useEffect(() => {
		setPageNumber(0);
	}, [searchText, statusFilter]);

	const invalidateCandidates = useCallback(() => {
		queryClient.invalidateQueries({ queryKey: ['candidates-list'] });
	}, [queryClient]);

	const handleDelete = (candidate: CandidateItem) => {
		setMenuAnchor(null);
		setConfirmState({
			open: true,
			title: 'Delete candidate',
			message: `Are you sure you want to delete ${candidate.FullName || candidate.Email}?`,
			onConfirm: async () => {
				setConfirmState((prev) => ({ ...prev, open: false }));

				if (!candidate.Cid) return;

				setActionLoading(candidate.Cid);
				try {
					await deleteCandidate(candidate.Cid);
					enqueueSnackbar('Candidate deleted.', { variant: 'success' });
					invalidateCandidates();
				} catch {
					enqueueSnackbar('Failed to delete candidate.', { variant: 'error' });
				} finally {
					setActionLoading(null);
				}
			}
		});
	};

	const handleInvite = async (candidate: CandidateItem) => {
		setMenuAnchor(null);

		if (!candidate.Cid) return;

		setActionLoading(candidate.Cid);
		try {
			await inviteCandidateToOpenAccount({ Cid: candidate.Cid, Email: candidate.Email });
			enqueueSnackbar('Invitation sent.', { variant: 'success' });
		} catch {
			enqueueSnackbar('Failed to send invitation.', { variant: 'error' });
		} finally {
			setActionLoading(null);
		}
	};

	if (!isReady) {
		return <FuseLoading />;
	}

	return (
		<Root
			header={
				<div className="flex flex-col gap-4 p-6">
					<div className="flex items-center justify-between">
						<div className="flex flex-col gap-1">
							<Typography variant="h6">My Candidates</Typography>
							<PageBreadcrumb />
						</div>
						<Button
							variant="contained"
							startIcon={<FuseSvgIcon>lucide:user-plus</FuseSvgIcon>}
							onClick={() => setAddDialogOpen(true)}
						>
							Add Candidate
						</Button>
					</div>
					<div className="flex flex-wrap items-center gap-3">
						<Paper
							className="flex items-center rounded-full px-3 py-1"
							variant="outlined"
						>
							<FuseSvgIcon size={18}>lucide:search</FuseSvgIcon>
							<InputBase
								className="ml-2 flex-1"
								placeholder="Search candidates..."
								value={searchText}
								onChange={(e) => setSearchText(e.target.value)}
							/>
						</Paper>
						{statuses && statuses.length > 0 && (
							<Select
								value={statusFilter}
								onChange={(e) => setStatusFilter(Number(e.target.value))}
								size="small"
								displayEmpty
							>
								<MenuItem value={0}>All statuses</MenuItem>
								{statuses.map((s) => (
									<MenuItem
										key={s.Value}
										value={s.Value}
									>
										{s.Name}
									</MenuItem>
								))}
							</Select>
						)}
					</div>
				</div>
			}
			content={
				<div className="p-6">
					{isLoading ? (
						<div className="flex items-center justify-center p-12">
							<CircularProgress />
						</div>
					) : error ? (
						<Alert severity="error">Failed to load candidates.</Alert>
					) : candidates.length === 0 ? (
						<div className="flex flex-col items-center gap-4 py-16">
							<FuseSvgIcon
								size={48}
								className="text-gray-400"
							>
								lucide:users
							</FuseSvgIcon>
							<Typography color="text.secondary">No candidates found.</Typography>
							<Button
								variant="outlined"
								onClick={() => setAddDialogOpen(true)}
							>
								Add your first candidate
							</Button>
						</div>
					) : (
						<>
							<div className="flex flex-col divide-y rounded-xl border">
								{candidates.map((candidate) => {
									const displayName =
										candidate.FullName ||
										`${candidate.FirstName || ''} ${candidate.LastName || ''}`.trim() ||
										candidate.Email;
									const isBusy = actionLoading === candidate.Cid;
									return (
										<div
											key={candidate.Cid || candidate.Email}
											className="flex flex-col gap-2 p-4 md:flex-row md:items-center md:justify-between"
										>
											<div className="flex items-center gap-3">
												<Avatar
													src={candidate.ProfileImage || undefined}
													className="h-10 w-10"
												>
													{(candidate.FirstName || candidate.Email || '?')[0]?.toUpperCase()}
												</Avatar>
												<div className="flex flex-col">
													<div className="flex items-center gap-2">
														<Typography className="font-medium">{displayName}</Typography>
														{candidate.IsVerified && (
															<FuseSvgIcon
																size={16}
																color="success"
															>
																lucide:badge-check
															</FuseSvgIcon>
														)}
													</div>
													<Typography
														variant="body2"
														color="text.secondary"
													>
														{candidate.Email}
													</Typography>
												</div>
											</div>
											<div className="flex items-center gap-4">
												{candidate.AvailabilityStatusText && (
													<Chip
														label={candidate.AvailabilityStatusText}
														size="small"
														variant="outlined"
													/>
												)}
												<Typography
													variant="caption"
													color="text.secondary"
												>
													{formatDate(candidate.Created)}
												</Typography>
												{isBusy ? (
													<CircularProgress size={20} />
												) : (
													<IconButton
														size="small"
														onClick={(e) => {
															setMenuAnchor(e.currentTarget);
															setMenuCandidate(candidate);
														}}
													>
														<FuseSvgIcon size={20}>lucide:ellipsis-vertical</FuseSvgIcon>
													</IconButton>
												)}
											</div>
										</div>
									);
								})}
							</div>

							{totalPages > 1 && (
								<div className="mt-4 flex items-center justify-center gap-2">
									<Button
										size="small"
										disabled={pageNumber === 0}
										onClick={() => setPageNumber((p) => p - 1)}
									>
										Previous
									</Button>
									<Typography variant="body2">
										Page {pageNumber + 1} of {totalPages}
									</Typography>
									<Button
										size="small"
										disabled={pageNumber + 1 >= totalPages}
										onClick={() => setPageNumber((p) => p + 1)}
									>
										Next
									</Button>
								</div>
							)}
						</>
					)}

					{/* Actions Menu */}
					<Menu
						anchorEl={menuAnchor}
						open={Boolean(menuAnchor)}
						onClose={() => {
							setMenuAnchor(null);
							setMenuCandidate(null);
						}}
					>
						<MenuItem
							onClick={() => {
								if (menuCandidate) handleInvite(menuCandidate);
							}}
						>
							<FuseSvgIcon size={18}>lucide:mail</FuseSvgIcon>
							<span className="ml-2">Invite to open account</span>
						</MenuItem>
						<MenuItem
							onClick={() => {
								if (menuCandidate) handleDelete(menuCandidate);
							}}
						>
							<FuseSvgIcon
								size={18}
								className="text-red-500"
							>
								lucide:trash
							</FuseSvgIcon>
							<span className="ml-2 text-red-500">Delete</span>
						</MenuItem>
					</Menu>

					<ConfirmDialog
						open={confirmState.open}
						title={confirmState.title}
						message={confirmState.message}
						onClose={() => setConfirmState((prev) => ({ ...prev, open: false }))}
						onConfirm={confirmState.onConfirm}
					/>

					<AddCandidateDialog
						open={addDialogOpen}
						onClose={() => setAddDialogOpen(false)}
						onSuccess={() => {
							setAddDialogOpen(false);
							invalidateCandidates();
							enqueueSnackbar('Candidate added.', { variant: 'success' });
						}}
					/>
				</div>
			}
			scroll={isMobile ? 'page' : 'content'}
		/>
	);
}

export default CandidateListPageView;
