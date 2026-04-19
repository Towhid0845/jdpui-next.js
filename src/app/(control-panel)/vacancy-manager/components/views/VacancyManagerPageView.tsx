'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import FusePageSimple from '@fuse/core/FusePageSimple';
import FuseLoading from '@fuse/core/FuseLoading';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { styled } from '@mui/material/styles';
import {
	Alert,
	Button,
	Chip,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	IconButton,
	InputBase,
	Menu,
	MenuItem,
	Paper,
	ToggleButton,
	ToggleButtonGroup,
	Tooltip,
	Typography
} from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import useUser from '@auth/useUser';
import useThemeMediaQuery from '@fuse/hooks/useThemeMediaQuery';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import { useSystemData } from '@/contexts/SystemDataContext';
import {
	VacancyItem,
	getVacancies,
	deleteVacancy,
	copyVacancy,
	publishUnpublishVacancy,
	archiveVacancy,
	updateStar
} from '@/api/services/vacancies';
import { getDashboardVacancyChart } from '@/api/services/dashboard';

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

type FilterValue = 'open' | 'close' | 'star' | 'unstar' | 'archived' | 'all';

const FILTERS: { label: string; value: FilterValue; icon: string }[] = [
	{ label: 'All', value: 'all', icon: 'lucide:list' },
	{ label: 'Open', value: 'open', icon: 'lucide:calendar' },
	{ label: 'Closed', value: 'close', icon: 'lucide:calendar-off' },
	{ label: 'Starred', value: 'star', icon: 'lucide:star' },
	{ label: 'Archived', value: 'archived', icon: 'lucide:archive' }
];

function ConfirmDialog({
	open,
	title,
	message,
	onClose,
	onConfirm,
	loading
}: {
	open: boolean;
	title: string;
	message: string;
	onClose: () => void;
	onConfirm: () => void;
	loading?: boolean;
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
					disabled={loading}
				>
					{loading ? <CircularProgress size={18} /> : 'Confirm'}
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

function isExpired(deadline?: string) {
	if (!deadline) return false;

	return new Date(deadline) < new Date();
}

function VacancyManagerPageView() {
	const { isReady } = useUser();
	const { isReady: systemReady } = useSystemData();
	const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down('lg'));
	const { enqueueSnackbar } = useSnackbar();
	const queryClient = useQueryClient();

	const [selectedFilter, setSelectedFilter] = useState<FilterValue>('open');
	const [searchText, setSearchText] = useState('');
	const [pageNumber, setPageNumber] = useState(0);
	const [pageSize] = useState(10);
	const [actionLoading, setActionLoading] = useState<number | null>(null);
	const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
	const [menuVacancy, setMenuVacancy] = useState<VacancyItem | null>(null);
	const [confirmState, setConfirmState] = useState<{
		open: boolean;
		title: string;
		message: string;
		onConfirm: () => void;
	}>({ open: false, title: '', message: '', onConfirm: () => {} });

	const vacancyPayload = useMemo(
		() => ({
			PageSize: pageSize,
			PageNumber: pageNumber + 1,
			Filter: selectedFilter === 'all' ? '' : selectedFilter,
			SearchText: searchText,
			Rid: 50439
		}),
		[pageSize, pageNumber, selectedFilter, searchText]
	);

	const {
		data: vacancyData,
		isLoading: vacancyLoading,
		error: vacancyError
	} = useQuery({
		queryKey: ['vacancies', vacancyPayload],
		queryFn: () => getVacancies(vacancyPayload),
		enabled: isReady && systemReady
	});

	const { data: chartData } = useQuery({
		queryKey: ['vacancy-chart'],
		queryFn: getDashboardVacancyChart,
		enabled: isReady
	});

	const vacancies = useMemo(() => vacancyData?.Jobs || [], [vacancyData]);
	const totalItems = vacancyData?.Paging?.TotalItems || 0;
	const totalPages = Math.ceil(totalItems / pageSize);

	useEffect(() => {
		setPageNumber(0);
	}, [selectedFilter, searchText]);

	const invalidateVacancies = useCallback(() => {
		queryClient.invalidateQueries({ queryKey: ['vacancies'] });
		queryClient.invalidateQueries({ queryKey: ['vacancy-chart'] });
	}, [queryClient]);

	const handleStar = async (vacancy: VacancyItem) => {
		setActionLoading(vacancy.VacId ?? null);
		try {
			await updateStar({ VacId: vacancy.VacId, IsStarred: !vacancy.IsStarred });
			invalidateVacancies();
		} catch {
			enqueueSnackbar('Failed to update star.', { variant: 'error' });
		} finally {
			setActionLoading(null);
		}
	};

	const handleDelete = (vacancy: VacancyItem) => {
		setMenuAnchor(null);
		setConfirmState({
			open: true,
			title: 'Delete vacancy',
			message: `Are you sure you want to delete "${vacancy.Title}"?`,
			onConfirm: async () => {
				setConfirmState((prev) => ({ ...prev, open: false }));
				setActionLoading(vacancy.VacId ?? null);
				try {
					await deleteVacancy({ VacId: vacancy.VacId });
					enqueueSnackbar('Vacancy deleted.', { variant: 'success' });
					invalidateVacancies();
				} catch {
					enqueueSnackbar('Failed to delete vacancy.', { variant: 'error' });
				} finally {
					setActionLoading(null);
				}
			}
		});
	};

	const handleCopy = async (vacancy: VacancyItem) => {
		setMenuAnchor(null);
		setActionLoading(vacancy.VacId ?? null);
		try {
			await copyVacancy({ VacId: vacancy.VacId });
			enqueueSnackbar('Vacancy copied.', { variant: 'success' });
			invalidateVacancies();
		} catch {
			enqueueSnackbar('Failed to copy vacancy.', { variant: 'error' });
		} finally {
			setActionLoading(null);
		}
	};

	const handlePublishToggle = async (vacancy: VacancyItem) => {
		setMenuAnchor(null);
		setActionLoading(vacancy.VacId ?? null);
		try {
			await publishUnpublishVacancy({ VacId: vacancy.VacId, Publish: !vacancy.PublishStatus });
			enqueueSnackbar(vacancy.PublishStatus ? 'Vacancy unpublished.' : 'Vacancy published.', {
				variant: 'success'
			});
			invalidateVacancies();
		} catch {
			enqueueSnackbar('Failed to update publish status.', { variant: 'error' });
		} finally {
			setActionLoading(null);
		}
	};

	const handleArchive = async (vacancy: VacancyItem) => {
		setMenuAnchor(null);
		setActionLoading(vacancy.VacId ?? null);
		try {
			await archiveVacancy(vacancy.VacId!);
			enqueueSnackbar('Vacancy archived.', { variant: 'success' });
			invalidateVacancies();
		} catch {
			enqueueSnackbar('Failed to archive vacancy.', { variant: 'error' });
		} finally {
			setActionLoading(null);
		}
	};

	const openMenu = (event: React.MouseEvent<HTMLElement>, vacancy: VacancyItem) => {
		setMenuAnchor(event.currentTarget);
		setMenuVacancy(vacancy);
	};

	const closeMenu = () => {
		setMenuAnchor(null);
		setMenuVacancy(null);
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
							<Typography variant="h6">Vacancy Manager</Typography>
							<PageBreadcrumb />
						</div>
					</div>

					{/* Chart Stats Header */}
					{chartData && (
						<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
							<Paper
								className="flex items-center gap-3 rounded-lg p-4"
								variant="outlined"
							>
								<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50">
									<FuseSvgIcon
										className="text-blue-600"
										size={24}
									>
										lucide:briefcase
									</FuseSvgIcon>
								</div>
								<div>
									<Typography
										className="text-2xl font-semibold"
										color="text.primary"
									>
										{chartData.OpenVacancies ?? chartData.TotalVacancies ?? 0}
									</Typography>
									<Typography
										variant="caption"
										color="text.secondary"
									>
										Open Vacancies
									</Typography>
								</div>
							</Paper>
							<Paper
								className="flex items-center gap-3 rounded-lg p-4"
								variant="outlined"
							>
								<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-50">
									<FuseSvgIcon
										className="text-indigo-600"
										size={24}
									>
										lucide:clipboard-list
									</FuseSvgIcon>
								</div>
								<div>
									<Typography
										className="text-2xl font-semibold"
										color="text.primary"
									>
										{chartData.TotalVacancies ?? 0}
									</Typography>
									<Typography
										variant="caption"
										color="text.secondary"
									>
										Total Vacancies
									</Typography>
								</div>
							</Paper>
							<Paper
								className="flex items-center gap-3 rounded-lg p-4"
								variant="outlined"
							>
								<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-50">
									<FuseSvgIcon
										className="text-green-600"
										size={24}
									>
										lucide:users
									</FuseSvgIcon>
								</div>
								<div>
									<Typography
										className="text-2xl font-semibold"
										color="text.primary"
									>
										{chartData.TotalApplicants ?? 0}
									</Typography>
									<Typography
										variant="caption"
										color="text.secondary"
									>
										Total Applicants
									</Typography>
								</div>
							</Paper>
							<Paper
								className="flex items-center gap-3 rounded-lg p-4"
								variant="outlined"
							>
								<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-50">
									<FuseSvgIcon
										className="text-amber-600"
										size={24}
									>
										lucide:check-circle
									</FuseSvgIcon>
								</div>
								<div>
									<Typography
										className="text-2xl font-semibold"
										color="text.primary"
									>
										{chartData.ShortListed ?? 0}
									</Typography>
									<Typography
										variant="caption"
										color="text.secondary"
									>
										Shortlisted
									</Typography>
								</div>
							</Paper>
						</div>
					)}

					{/* Filters + Search */}
					<div className="flex flex-wrap items-center justify-between gap-3">
						<ToggleButtonGroup
							value={selectedFilter}
							exclusive
							onChange={(_, value) => {
								if (value !== null) setSelectedFilter(value);
							}}
							size="small"
						>
							{FILTERS.map((f) => (
								<ToggleButton
									key={f.value}
									value={f.value}
								>
									<FuseSvgIcon size={16}>{f.icon}</FuseSvgIcon>
									<span className="ml-1 text-xs">{f.label}</span>
								</ToggleButton>
							))}
						</ToggleButtonGroup>
						<Paper
							className="flex items-center rounded-full px-3 py-1"
							variant="outlined"
						>
							<FuseSvgIcon size={18}>lucide:search</FuseSvgIcon>
							<InputBase
								className="ml-2 flex-1"
								placeholder="Search vacancies..."
								value={searchText}
								onChange={(e) => setSearchText(e.target.value)}
							/>
						</Paper>
					</div>
				</div>
			}
			content={
				<div className="p-6">
					{vacancyLoading ? (
						<div className="flex items-center justify-center p-12">
							<CircularProgress />
						</div>
					) : vacancyError ? (
						<Alert severity="error">Failed to load vacancies.</Alert>
					) : vacancies.length === 0 ? (
						<div className="flex flex-col items-center gap-4 py-16">
							<FuseSvgIcon
								size={48}
								className="text-gray-400"
							>
								lucide:clipboard-list
							</FuseSvgIcon>
							<Typography color="text.secondary">No vacancies found.</Typography>
						</div>
					) : (
						<>
							<div className="flex flex-col gap-3">
								{vacancies.map((vacancy, index	) => {
									const expired = isExpired(vacancy.DeadLine);
									const isBusy = actionLoading === vacancy.VacId;
									return (
										<Paper
											key={`${vacancy.VacId}-${index}`}
											className="flex flex-col gap-2 rounded-xl border p-4 md:flex-row md:items-center md:justify-between"
											variant="outlined"
										>
											<div className="flex flex-1 items-start gap-3">
												<IconButton
													size="small"
													onClick={() => handleStar(vacancy)}
													disabled={isBusy}
												>
													<FuseSvgIcon
														size={20}
														className={
															vacancy.IsStarred ? 'text-amber-500' : 'text-gray-400'
														}
													>
														{vacancy.IsStarred ? 'lucide:star' : 'lucide:star'}
													</FuseSvgIcon>
												</IconButton>
												<div className="flex flex-col gap-1">
													<div className="flex items-center gap-2">
														<Typography className="font-medium">
															{vacancy.Title || 'Untitled'}
														</Typography>
														{vacancy.PublishStatus && (
															<Chip
																label="Published"
																size="small"
																color="success"
																variant="outlined"
															/>
														)}
														{expired && !vacancy.IsArchived && (
															<Chip
																label="Expired"
																size="small"
																color="error"
																variant="outlined"
															/>
														)}
														{vacancy.IsArchived && (
															<Chip
																label="Archived"
																size="small"
																color="default"
																variant="outlined"
															/>
														)}
													</div>
													<div className="flex flex-wrap items-center gap-3 text-sm">
														<Typography
															variant="body2"
															color="text.secondary"
														>
															Deadline: {formatDate(vacancy.DeadLine)}
														</Typography>
														{vacancy.Type && (
															<Typography
																variant="body2"
																color="text.secondary"
															>
																{vacancy.Type}
															</Typography>
														)}
														{(vacancy.MinSalary || vacancy.MaxSalary) && (
															<Typography
																variant="body2"
																color="text.secondary"
															>
																{vacancy.SalaryCurrency || ''}{' '}
																{vacancy.MinSalary?.toLocaleString() || '0'} –{' '}
																{vacancy.MaxSalary?.toLocaleString() || '0'}
															</Typography>
														)}
													</div>
												</div>
											</div>
											<div className="flex items-center gap-4">
												<Tooltip title="Applicants">
													<div className="flex items-center gap-1">
														<FuseSvgIcon
															size={16}
															className="text-gray-500"
														>
															lucide:users
														</FuseSvgIcon>
														<Typography variant="body2">
															{vacancy.TotalApplicants ?? 0}
														</Typography>
													</div>
												</Tooltip>
												<Tooltip title="Shortlisted">
													<div className="flex items-center gap-1">
														<FuseSvgIcon
															size={16}
															className="text-gray-500"
														>
															lucide:check-circle
														</FuseSvgIcon>
														<Typography variant="body2">
															{vacancy.TotalShortlist ?? 0}
														</Typography>
													</div>
												</Tooltip>
												{isBusy ? (
													<CircularProgress size={20} />
												) : (
													<IconButton
														size="small"
														onClick={(e) => openMenu(e, vacancy)}
													>
														<FuseSvgIcon size={20}>lucide:ellipsis-vertical</FuseSvgIcon>
													</IconButton>
												)}
											</div>
										</Paper>
									);
								})}
							</div>

							{/* Pagination */}
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
						onClose={closeMenu}
					>
						<MenuItem
							onClick={() => {
								if (menuVacancy) handlePublishToggle(menuVacancy);
							}}
						>
							<FuseSvgIcon size={18}>
								{menuVacancy?.PublishStatus ? 'lucide:eye-off' : 'lucide:eye'}
							</FuseSvgIcon>
							<span className="ml-2">{menuVacancy?.PublishStatus ? 'Unpublish' : 'Publish'}</span>
						</MenuItem>
						<MenuItem
							onClick={() => {
								if (menuVacancy) handleCopy(menuVacancy);
							}}
						>
							<FuseSvgIcon size={18}>lucide:copy</FuseSvgIcon>
							<span className="ml-2">Copy</span>
						</MenuItem>
						{!menuVacancy?.IsArchived && (
							<MenuItem
								onClick={() => {
									if (menuVacancy) handleArchive(menuVacancy);
								}}
							>
								<FuseSvgIcon size={18}>lucide:archive</FuseSvgIcon>
								<span className="ml-2">Archive</span>
							</MenuItem>
						)}
						<MenuItem
							onClick={() => {
								if (menuVacancy) handleDelete(menuVacancy);
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
				</div>
			}
			scroll={isMobile ? 'page' : 'content'}
		/>
	);
}

export default VacancyManagerPageView;
