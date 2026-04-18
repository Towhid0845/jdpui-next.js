'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import FusePageSimple from '@fuse/core/FusePageSimple';
import FuseLoading from '@fuse/core/FuseLoading';
import { styled } from '@mui/material/styles';
import {
	Autocomplete,
	Badge,
	Button,
	Chip,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControl,
	IconButton,
	InputBase,
	Menu,
	MenuItem,
	Paper,
	Select,
	Slider,
	Switch,
	TextField,
	ToggleButton,
	ToggleButtonGroup,
	Typography
} from '@mui/material';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import StarIcon from '@mui/icons-material/Star';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { useSnackbar } from 'notistack';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import useUser from '@auth/useUser';
import useThemeMediaQuery from '@fuse/hooks/useThemeMediaQuery';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import { useSystemData } from '@/contexts/SystemDataContext';
import type { TypeInfoItem } from '@/api/services/typeInfos';
import {
	OnlineVacancyJob,
	OnlineVacancyResponse,
	adminDeleteAllJobDataBySourceKey,
	adminDeleteJobData,
	adminDeletePublishedVacancy,
	applyAsCandidateUser,
	checkCandidateProfileEligible,
	getCandidateForCandidate,
	getCandidateProfiles,
	getFavoriteJobs,
	getOnlineVacancies,
	getProfileTags,
	getSolarJobDetail,
	getVacancyDetail,
	markSolrJobAsPro,
	saveRemoveFavJob,
	unmarkSolrJobAsPro
} from '@/api/services/onlineVacancies';

const FILTER_LOCATIONS = [
	'Dhaka',
	'Chittagong',
	'Khulna',
	'Rajshahi',
	'Barishal',
	'Sylhet',
	'Rangpur'
];

const Root = styled(FusePageSimple)(({ theme }) => ({
	'& .FusePageSimple-header': {
		backgroundColor: theme.vars.palette.background.paper,
		borderBottomWidth: 1,
		borderStyle: 'solid',
		borderColor: theme.vars.palette.divider
	},
	'& .FusePageSimple-contentWrapper': {
		paddingTop: theme.spacing(2)
	},
	'& .FusePageSimple-content': {
		padding: 0
	},
	'& .container': {
		maxWidth: '100%!important',
		width: '100%',
		margin: '0 auto',
		paddingLeft: '20px',
		paddingRight: '20px'
	}
}));

function useDebouncedValue<T>(value: T, delay = 600) {
	const [debounced, setDebounced] = useState(value);
	useEffect(() => {
		const timer = setTimeout(() => setDebounced(value), delay);
		return () => clearTimeout(timer);
	}, [value, delay]);
	return debounced;
}

function formatRelativeDate(value: unknown) {
	if (!value) return '';
	const date = value instanceof Date ? value : new Date(`${value}`);
	if (Number.isNaN(date.getTime())) return '';
	return formatDistanceToNow(date, { addSuffix: true });
}

function formatCompactNumber(value?: number) {
	if (!value && value !== 0) return '';
	const abs = Math.abs(value);
	if (abs >= 1e12) return `${(value / 1e12).toFixed(Number.isInteger(value / 1e12) ? 0 : 2)}T`;
	if (abs >= 1e9) return `${(value / 1e9).toFixed(Number.isInteger(value / 1e9) ? 0 : 2)}B`;
	if (abs >= 1e6) return `${(value / 1e6).toFixed(Number.isInteger(value / 1e6) ? 0 : 2)}M`;
	if (abs >= 1e3) return `${(value / 1e3).toFixed(Number.isInteger(value / 1e3) ? 0 : 2)}K`;
	return `${value}`;
}

function normalizeFavoriteJobs(data: unknown[] | undefined) {
	if (!Array.isArray(data)) return [];
	return data
		.map((item) => {
			if (item && typeof item === 'object' && 'Job' in item) {
				return (item as { Job?: OnlineVacancyJob }).Job;
			}
			return item as OnlineVacancyJob;
		})
		.filter(Boolean) as OnlineVacancyJob[];
}

function resolveSolarUrl(url?: string | null) {
	if (!url) return '';
	const normalized = url.trim();
	if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
		return normalized;
	}
	return `https://${normalized}`;
}

type PreScreenState = {
	open: boolean;
	questions: string[];
	job: { VacancyId: number; RecruiterRid: number; ProfileId: number } | null;
};

type ConfirmState = {
	open: boolean;
	message: string;
	onConfirm?: () => void;
};

type SolarDialogState = {
	open: boolean;
	job: OnlineVacancyJob | null;
	loading: boolean;
	html: string;
	sourceUrl: string;
	sourceKey: string;
	sourceUid: string;
};

function OnlineVacanciesPageView() {
	const { data: user, isReady } = useUser();
	const { typeInfos, getLabel, isReady: systemReady } = useSystemData();
	const { enqueueSnackbar } = useSnackbar();
	const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down('lg'));

	const accountType = Number(user?.accountType ?? (user?.profile as any)?.AccountType ?? 0);
	const userProfile = (user?.profile || {}) as any;
	const roles = Array.isArray(user?.role) ? user?.role : user?.role ? [user?.role] : [];
	const isAdminUser =
		Boolean(userProfile?.IsAdminMobile) ||
		roles.some((role) => ['admin', 'dataadmin', 'data-admin', 'data_admin'].includes(`${role}`.toLowerCase()));
	const isCandidate = accountType === 2;
	const isRecruiter = accountType === 1;

	const sectors = useMemo(() => typeInfos['System.Sector'] || [], [typeInfos]);
	const jobTypes = useMemo(() => typeInfos['Vacancy.Jobtype'] || [], [typeInfos]);
	const currencies = useMemo(
		() => [{ Name: 'Any', Value: 0 } as TypeInfoItem].concat(typeInfos['System.Currency'] || []),
		[typeInfos]
	);

	const [searchTerm, setSearchTerm] = useState('');
	const [searchOverride, setSearchOverride] = useState<string | null>(null);
	const debouncedSearch = useDebouncedValue(searchTerm, 600);
	const effectiveSearch = searchOverride ?? debouncedSearch;

	const [selectedSources, setSelectedSources] = useState<'all' | 'jdp'>('all');
	const [proOnly, setProOnly] = useState(false);
	const [selectedSectors, setSelectedSectors] = useState<TypeInfoItem[]>([]);
	const [selectedTypes, setSelectedTypes] = useState<TypeInfoItem[]>([]);
	const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
	const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
	const [minSalary, setMinSalary] = useState(0);
	const [maxSalary, setMaxSalary] = useState(200000);
	const [selectedCurrency, setSelectedCurrency] = useState('Any');

	const [favoriteJobs, setFavoriteJobs] = useState<OnlineVacancyJob[]>([]);
	const [preScreenState, setPreScreenState] = useState<PreScreenState>({
		open: false,
		questions: [],
		job: null
	});
	const [preScreenAnswers, setPreScreenAnswers] = useState<string[]>([]);
	const [confirmState, setConfirmState] = useState<ConfirmState>({ open: false, message: '' });
	const [solarDialog, setSolarDialog] = useState<SolarDialogState>({
		open: false,
		job: null,
		loading: false,
		html: '',
		sourceUrl: '',
		sourceKey: '',
		sourceUid: ''
	});
	const [shareDialog, setShareDialog] = useState<{ open: boolean; link: string; title: string }>({
		open: false,
		link: '',
		title: ''
	});
	const [infoDialogOpen, setInfoDialogOpen] = useState(false);

	const [salaryAnchor, setSalaryAnchor] = useState<null | HTMLElement>(null);
	const [sectorAnchor, setSectorAnchor] = useState<null | HTMLElement>(null);
	const [locationAnchor, setLocationAnchor] = useState<null | HTMLElement>(null);
	const [companyAnchor, setCompanyAnchor] = useState<null | HTMLElement>(null);
	const [typeAnchor, setTypeAnchor] = useState<null | HTMLElement>(null);
	const [moreAnchor, setMoreAnchor] = useState<null | HTMLElement>(null);
	const [moreJob, setMoreJob] = useState<OnlineVacancyJob | null>(null);
	const [applyAnchor, setApplyAnchor] = useState<null | HTMLElement>(null);
	const [applyJob, setApplyJob] = useState<OnlineVacancyJob | null>(null);
	const autoLoadRef = useRef<HTMLDivElement | null>(null);
	const hasInitCurrency = useRef(false);

	useEffect(() => {
		if (!userProfile?.Currency || hasInitCurrency.current) return;
		setSelectedCurrency(userProfile.Currency);
		hasInitCurrency.current = true;
	}, [userProfile?.Currency]);

	useEffect(() => {
		if (!searchOverride) return;
		const timer = setTimeout(() => setSearchOverride(null), 0);
		return () => clearTimeout(timer);
	}, [searchOverride]);

	const candidateInfoQuery = useQuery({
		queryKey: ['candidate-info'],
		queryFn: getCandidateForCandidate,
		enabled: isCandidate && isReady
	});

	const candidateProfilesQuery = useQuery({
		queryKey: ['candidate-profiles', candidateInfoQuery.data?.Cid],
		queryFn: () =>
			getCandidateProfiles({
				CandidateId: candidateInfoQuery.data?.Cid,
				PageNumber: 1,
				PageSize: 100
			}),
		enabled: isCandidate && Boolean(candidateInfoQuery.data?.Cid)
	});

	const profiles = candidateProfilesQuery.data?.Result || [];

	const profileTagsQuery = useQuery({
		queryKey: ['profile-tags'],
		queryFn: getProfileTags,
		enabled: isCandidate && isReady
	});

	const matchedJobsQuery = useQuery({
		queryKey: ['matched-jobs', profileTagsQuery.data],
		queryFn: async () => {
			const tags = Array.isArray(profileTagsQuery.data) ? profileTagsQuery.data : [];
			const flattened = tags
				.filter((tag) => tag)
				.flatMap((tag) => `${tag}`.split(','))
				.map((tag) => tag.trim())
				.filter(Boolean);
			if (!flattened.length) return { Jobs: [] } as OnlineVacancyResponse;
			return getOnlineVacancies({
				Tags: flattened,
				IsJobdeskOnly: false,
				PageNumber: 1,
				PageSize: 30
			});
		},
		enabled: isCandidate && Array.isArray(profileTagsQuery.data) && profileTagsQuery.data.length > 0
	});

	const favoriteJobsQuery = useQuery({
		queryKey: ['favorite-jobs'],
		queryFn: getFavoriteJobs,
		enabled: isCandidate && isReady
	});

	useEffect(() => {
		if (favoriteJobsQuery.data) {
			setFavoriteJobs(normalizeFavoriteJobs(favoriteJobsQuery.data));
		}
	}, [favoriteJobsQuery.data]);

	const queryModel = useMemo(() => {
		const selectedTypeIds = selectedTypes.map((type) => type.Value).filter((value) => Number.isFinite(value));
		const selectedSectorIds = selectedSectors.map((sector) => sector.Value).filter((value) => Number.isFinite(value));
		const filteredJobTypeString = selectedTypes
			.map((type) => type.Name || type.ValueText)
			.filter(Boolean)
			.join(';');
		const filteredSectorString = selectedSectors
			.map((sector) => sector.Name || sector.ValueText)
			.filter(Boolean)
			.join(';');
		const filterLocationString = selectedLocations.join(';');
		const filterCompanyString = selectedCompanies.join(';');

		const isJobdeskOnly = false;//selectedSources === 'all' && accountType !== 2 && accountType !== 3 ? false : true;

		const model: Record<string, unknown> = {
			SearchText: effectiveSearch,
			PageSize: 30,
			IsJobdeskOnly: isJobdeskOnly,
			StrLocation: filterLocationString,
			JobType: selectedTypeIds,
			Sectors: selectedSectorIds,
			Companies: filterCompanyString,
			StrSector: filteredSectorString,
			StrJobType: filteredJobTypeString,
			ProOnly: proOnly
		};

		if (minSalary !== 0 || maxSalary !== 200000) {
			model.MinSalary = minSalary;
			model.MaxSalary = maxSalary === 200000 ? 0 : maxSalary;
		}

		if (selectedCurrency) {
			model.Currency = selectedCurrency === 'Any' ? 'any' : selectedCurrency;
		}

		return model;
	}, [
		accountType,
		effectiveSearch,
		maxSalary,
		minSalary,
		proOnly,
		selectedCompanies,
		selectedCurrency,
		selectedLocations,
		selectedSectors,
		selectedSources,
		selectedTypes
	]);

	const vacancyQuery = useInfiniteQuery({
		queryKey: ['online-vacancies', queryModel],
		queryFn: ({ pageParam = 1 }) =>
			getOnlineVacancies({
				...queryModel,
				PageNumber: pageParam
			}),
		getNextPageParam: (lastPage, allPages) => {
			const total = lastPage?.Paging?.TotalItems ?? 0;
			const loaded = allPages.reduce((sum, page) => sum + (page?.Jobs?.length || 0), 0);
			if (loaded < total) {
				return allPages.length + 1;
			}
			return undefined;
		},
		enabled: isReady && systemReady
	});

	const jobs = useMemo(
		() => vacancyQuery.data?.pages.flatMap((page) => page?.Jobs ?? []) ?? [],
		[vacancyQuery.data]
	);
	const totalJobs = vacancyQuery.data?.pages?.[0]?.Paging?.TotalItems ?? 0;

	useEffect(() => {
		if (!autoLoadRef.current) return;
		if (!vacancyQuery.hasNextPage) return;

		const root = isMobile
			? null
			: (document.querySelector('.FusePageSimple-content') as HTMLElement | null);

		const observer = new IntersectionObserver(
			(entries) => {
				const entry = entries[0];
				if (!entry?.isIntersecting) return;
				if (vacancyQuery.hasNextPage && !vacancyQuery.isFetchingNextPage) {
					vacancyQuery.fetchNextPage();
				}
			},
			{
				root,
				rootMargin: '200px 0px',
				threshold: 0
			}
		);

		observer.observe(autoLoadRef.current);

		return () => observer.disconnect();
	}, [
		isMobile,
		vacancyQuery.hasNextPage,
		vacancyQuery.isFetchingNextPage,
		vacancyQuery.fetchNextPage,
		jobs.length
	]);

	const hasFilter = Boolean(
		selectedTypes.length ||
			selectedSectors.length ||
			selectedLocations.length ||
			selectedCompanies.length ||
			minSalary > 0 ||
			maxSalary !== 200000
	);

	const handleResetFilters = () => {
		setSelectedTypes([]);
		setSelectedSectors([]);
		setSelectedLocations([]);
		setSelectedCompanies([]);
		setMinSalary(0);
		setMaxSalary(200000);
		setSelectedCurrency(userProfile?.Currency || 'Any');
	};

	const handleCopyLink = async (job: OnlineVacancyJob) => {
		if (!job.ApplyLink) {
			enqueueSnackbar(getLabel('link-not-found', 'Link not available'), { variant: 'warning' });
			return;
		}
		try {
			await navigator.clipboard.writeText(job.ApplyLink);
			enqueueSnackbar(getLabel('link-copied-clipbord', 'Link copied to clipboard!'), { variant: 'success' });
		} catch {
			enqueueSnackbar(getLabel('link-copied-clipbord', 'Link copied to clipboard!'), { variant: 'info' });
		}
	};

	const handleShareJob = (job: OnlineVacancyJob) => {
		if (!job.ApplyLink) {
			enqueueSnackbar(getLabel('link-not-found', 'Link not available'), { variant: 'warning' });
			return;
		}
		setShareDialog({ open: true, link: job.ApplyLink, title: job.Title || '' });
	};

	const handleApplyLink = (job: OnlineVacancyJob) => {
		if (!job.ApplyLink) return;
		window.open(job.ApplyLink, '_blank');
	};

	const handleViewSolarJob = async (job: OnlineVacancyJob) => {
		if (!job.JobUid) {
			enqueueSnackbar(getLabel('details-not-found', 'Sorry! Details are not found'), { variant: 'warning' });
			return;
		}
		setSolarDialog({ open: true, job, loading: true, html: '', sourceUrl: '', sourceKey: '', sourceUid: '' });
		try {
			const detail = await getSolarJobDetail(job.JobUid);
			const sourceUrl = resolveSolarUrl(detail?.sourceURL || '');
			setSolarDialog({
				open: true,
				job,
				loading: false,
				html: detail?.rawContent || '',
				sourceUrl,
				sourceKey: detail?.sourceKey || '',
				sourceUid: detail?.sourceUID || ''
			});
		} catch {
			enqueueSnackbar(getLabel('details-not-found', 'Sorry! Details are not found'), { variant: 'warning' });
			setSolarDialog({ open: false, job: null, loading: false, html: '', sourceUrl: '', sourceKey: '', sourceUid: '' });
		}
	};

	const handleToggleFavorite = async (job: OnlineVacancyJob) => {
		if (!job.Id) return;
		try {
			const res = await saveRemoveFavJob(job.Id);
			if (res === 1) {
				enqueueSnackbar(getLabel('add-favorite-success', 'Successfully added to favorite'), { variant: 'success' });
				setFavoriteJobs((prev) => [...prev, job]);
			} else if (res === 2) {
				enqueueSnackbar(getLabel('remove-favorite-success', 'Successfully removed from favorite'), {
					variant: 'success'
				});
				setFavoriteJobs((prev) => prev.filter((item) => item?.Id !== job.Id));
			} else {
				enqueueSnackbar(getLabel('something-went-wrong', 'Something went wrong'), { variant: 'warning' });
			}
		} catch {
			enqueueSnackbar(getLabel('something-went-wrong', 'Something went wrong'), { variant: 'warning' });
		}
	};

	const isFavoriteJob = useCallback(
		(job: OnlineVacancyJob) => favoriteJobs.some((item) => item?.Id === job.Id),
		[favoriteJobs]
	);

	const handleApplyForJob = async (job: OnlineVacancyJob, profile: { Pid: number }) => {
		if (!job.SourceVacId || !job.Rid) return;
		try {
			const eligibility = await checkCandidateProfileEligible(profile.Pid);
			if (eligibility === 1) {
				enqueueSnackbar(
					getLabel('apply-need-edu', 'Please add at least 1 education to apply for this job'),
					{ variant: 'warning' }
				);
				return;
			}
			if (eligibility === 2) {
				enqueueSnackbar(getLabel('apply-need-skill', 'Please add at least 2 skills to apply for this job'), {
					variant: 'warning'
				});
				return;
			}
			if (eligibility === 3) {
				enqueueSnackbar(getLabel('apply-need-obj', 'Please add career objective to apply for this job'), {
					variant: 'warning'
				});
				return;
			}

			let prescreenQuestions: string[] = [];
			try {
				const vacancy = await getVacancyDetail(job.RefCode || '', job.Rid, null);
				prescreenQuestions = ['Prescreen1', 'Prescreen2', 'Prescreen3', 'Prescreen4']
					.map((key) => `${vacancy?.[key] || ''}`.trim())
					.filter((value) => value);
			} catch {
				prescreenQuestions = [];
			}

			if (prescreenQuestions.length) {
				setPreScreenAnswers(new Array(prescreenQuestions.length).fill(''));
				setPreScreenState({
					open: true,
					questions: prescreenQuestions,
					job: {
						VacancyId: job.SourceVacId,
						RecruiterRid: job.Rid,
						ProfileId: profile.Pid
					}
				});
				return;
			}

			const res = await applyAsCandidateUser({
				VacancyId: job.SourceVacId,
				RecruiterRid: job.Rid,
				ProfileId: profile.Pid
			});
			if (res === 1) {
				enqueueSnackbar(getLabel('apply-success', 'You have successfully applied, thank you!'), {
					variant: 'success'
				});
			} else if (res === 2) {
				enqueueSnackbar(
					getLabel(
						'alr-applied-wrong',
						'You have already applied or something went wrong, please try again or contact support!'
					),
					{ variant: 'warning' }
				);
			} else {
				enqueueSnackbar(
					getLabel('went-wrng-support', 'Something went wrong, Please try again or contact support!'),
					{ variant: 'warning' }
				);
			}
		} catch {
			enqueueSnackbar(getLabel('went-wrng-support', 'Something went wrong, Please try again or contact support!'), {
				variant: 'warning'
			});
		}
	};

	const handleSubmitPrescreen = async () => {
		if (!preScreenState.job) return;
		const payload: Record<string, unknown> = {
			VacancyId: preScreenState.job.VacancyId,
			RecruiterRid: preScreenState.job.RecruiterRid,
			ProfileId: preScreenState.job.ProfileId
		};
		preScreenAnswers.forEach((answer, index) => {
			payload[`PrescreenAnswer${index + 1}`] = answer;
		});
		try {
			const res = await applyAsCandidateUser(payload);
			if (res === 1) {
				enqueueSnackbar(getLabel('apply-success', 'You have successfully applied, thank you!'), {
					variant: 'success'
				});
			} else if (res === 2) {
				enqueueSnackbar(
					getLabel(
						'alr-applied-wrong',
						'You have already applied or something went wrong, please try again or contact support!'
					),
					{ variant: 'warning' }
				);
			} else {
				enqueueSnackbar(
					getLabel('went-wrng-support', 'Something went wrong, Please try again or contact support!'),
					{ variant: 'warning' }
				);
			}
		} catch {
			enqueueSnackbar(getLabel('went-wrng-support', 'Something went wrong, Please try again or contact support!'), {
				variant: 'warning'
			});
		} finally {
			setPreScreenState({ open: false, questions: [], job: null });
		}
	};

	const requestConfirm = (message: string, onConfirm: () => void) => {
		setConfirmState({ open: true, message, onConfirm });
	};

	const handleAdminDeleteVacancy = (job: OnlineVacancyJob) => {
		requestConfirm(
			getLabel('admin-del-vacancy-ask', 'Are you sure you want to delete this vacancy?'),
			async () => {
				try {
					await adminDeletePublishedVacancy(job);
					enqueueSnackbar(getLabel('admin-delete-vacancy-sucess', 'Successfully deleted vacancy'), {
						variant: 'success'
					});
					vacancyQuery.refetch();
				} catch {
					enqueueSnackbar(getLabel('admin-del-vacancy-fail', 'Failed to delete vacancy'), { variant: 'warning' });
				}
			}
		);
	};

	const handleMarkSolarJobPro = async (job: OnlineVacancyJob) => {
		if (!job.JobUid) return;
		try {
			await markSolrJobAsPro(job.JobUid);
			enqueueSnackbar(getLabel('marked-as-pro', 'Marked as pro'), { variant: 'success' });
			vacancyQuery.refetch();
		} catch {
			enqueueSnackbar(getLabel('mark-pro-fail', 'Failed to mark as pro'), { variant: 'warning' });
		}
	};

	const handleUnmarkSolarJobPro = async (job: OnlineVacancyJob) => {
		if (!job.JobUid) return;
		try {
			await unmarkSolrJobAsPro(job.JobUid);
			enqueueSnackbar(getLabel('unmarked-as-pro', 'Unmarked as pro'), { variant: 'success' });
			vacancyQuery.refetch();
		} catch {
			enqueueSnackbar(getLabel('unmark-pro-fail', 'Failed to unmark as pro'), { variant: 'warning' });
		}
	};

	const handleDeleteAllJobData = (job: OnlineVacancyJob) => {
		if (!job.JobUid) return;
		requestConfirm(getLabel('dlt-all-jobs-data', 'DELETE ALL JOBS DATA'), async () => {
			try {
				const detail = await getSolarJobDetail(job.JobUid as string);
				if (!detail?.sourceKey) {
					enqueueSnackbar(getLabel('delete-failed', 'Failed to delete data'), { variant: 'warning' });
					return;
				}
				await adminDeleteAllJobDataBySourceKey(detail.sourceKey);
				enqueueSnackbar(getLabel('delete-success', 'Deleted job data'), { variant: 'success' });
				vacancyQuery.refetch();
			} catch {
				enqueueSnackbar(getLabel('delete-failed', 'Failed to delete data'), { variant: 'warning' });
			}
		});
	};

	const handleDeleteJobData = (job: OnlineVacancyJob) => {
		if (!job.JobUid) return;
		requestConfirm(getLabel('delete-job', 'DELETE JOB'), async () => {
			try {
				const detail = await getSolarJobDetail(job.JobUid as string);
				if (!detail?.sourceKey || !detail?.sourceUID) {
					enqueueSnackbar(getLabel('delete-failed', 'Failed to delete data'), { variant: 'warning' });
					return;
				}
				await adminDeleteJobData(detail.sourceKey, detail.sourceUID);
				enqueueSnackbar(getLabel('delete-success', 'Deleted job data'), { variant: 'success' });
				vacancyQuery.refetch();
			} catch {
				enqueueSnackbar(getLabel('delete-failed', 'Failed to delete data'), { variant: 'warning' });
			}
		});
	};

	const matchedJobs = matchedJobsQuery.data?.Jobs || [];

	if (!isReady) {
		return <FuseLoading />;
	}

	return (
		<Root
			header={
				<div className="container py-6">
					<PageBreadcrumb className="mb-3" />
					<Typography variant="h5">{getLabel('live-jobs-upper', 'Live Jobs')}</Typography>
				</div>
			}
			content={
				<div className="container pb-6">
					<div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg bg-white px-4 py-3 shadow-sm">
						<Paper className="flex flex-1 items-center rounded-md border border-divider px-2">
							<InputBase
								className="flex-1 px-2 py-1 text-sm"
								placeholder={getLabel('search-vacancy', 'Search Vacancy')}
								value={searchTerm}
								onChange={(event) => setSearchTerm(event.target.value)}
								onKeyDown={(event) => {
									if (event.key === 'Enter') {
										setSearchOverride(searchTerm);
									}
								}}
							/>
							<FuseSvgIcon color="action">lucide:search</FuseSvgIcon>
						</Paper>

						<div className="flex items-center gap-1">
							{hasFilter && (
								<IconButton onClick={handleResetFilters} size="small">
									<FuseSvgIcon className="text-error">lucide:rotate-ccw</FuseSvgIcon>
								</IconButton>
							)}
							<Badge color="secondary" badgeContent={maxSalary !== 200000 || minSalary !== 0 ? 1 : 0}>
								<IconButton onClick={(event) => setSalaryAnchor(event.currentTarget)} size="small">
									<FuseSvgIcon>lucide:badge-dollar-sign</FuseSvgIcon>
								</IconButton>
							</Badge>
							<Badge color="secondary" badgeContent={selectedSectors.length}>
								<IconButton onClick={(event) => setSectorAnchor(event.currentTarget)} size="small">
									<FuseSvgIcon>lucide:layers</FuseSvgIcon>
								</IconButton>
							</Badge>
							<Badge color="secondary" badgeContent={selectedLocations.length}>
								<IconButton onClick={(event) => setLocationAnchor(event.currentTarget)} size="small">
									<FuseSvgIcon>lucide:map-pin</FuseSvgIcon>
								</IconButton>
							</Badge>
							<Badge color="secondary" badgeContent={selectedCompanies.length}>
								<IconButton onClick={(event) => setCompanyAnchor(event.currentTarget)} size="small">
									<FuseSvgIcon>lucide:building</FuseSvgIcon>
								</IconButton>
							</Badge>
							<Badge color="secondary" badgeContent={selectedTypes.length}>
								<IconButton onClick={(event) => setTypeAnchor(event.currentTarget)} size="small">
									<FuseSvgIcon>lucide:list-checks</FuseSvgIcon>
								</IconButton>
							</Badge>
						</div>

						{isRecruiter && (
							<div className="flex items-center gap-2">
								<Typography className="text-sm text-primary">
									{getLabel('recruiters', 'Recruiters')}
								</Typography>
								<Switch checked={proOnly} onChange={(event) => setProOnly(event.target.checked)} />
							</div>
						)}
					</div>

					{isRecruiter && (
						<div className="mb-4 flex items-center justify-end">
							<ToggleButtonGroup
								value={selectedSources}
								exclusive
								onChange={(_, value) => value && setSelectedSources(value)}
								size="small"
							>
								<ToggleButton value="all">{getLabel('all-src', 'All Source')}</ToggleButton>
								<ToggleButton value="jdp">jobdesk</ToggleButton>
							</ToggleButtonGroup>
						</div>
					)}

					{matchedJobs.length > 0 && (
						<div className="mb-6">
							<Typography className="mb-3 text-sm font-medium text-primary">
								{getLabel('my-vacancy', 'My Vacancy')}
							</Typography>
							<div className="flex gap-4 overflow-x-auto pb-2">
								{matchedJobs.map((job) => (
									<Paper
										key={job.SourceVacId || job.Id || job.JobUid}
										className="min-w-[280px] flex-1 cursor-pointer rounded-lg border border-primary/30 p-4 shadow-sm"
										onClick={() => handleApplyLink(job)}
									>
										<div className="flex items-start gap-3">
											<img
												src={job.CompanyLogo || '/assets/images/ovlist/c_place_1.png'}
												alt=""
												className="h-8 w-8 rounded"
											/>
											<div className="min-w-0 flex-1">
												<Typography className="truncate font-medium">{job.Title}</Typography>
												<Typography className="truncate text-xs text-muted">{job.CompanyName}</Typography>
												<Typography className="text-xs text-muted">{job.JobTypeText}</Typography>
											</div>
										</div>
										<div className="mt-3 flex items-center justify-between text-xs text-muted">
											<span className="flex items-center gap-1">
												<FuseSvgIcon size={14}>lucide:map-pin</FuseSvgIcon>
												{job.JobLocation || '-'}
											</span>
											<span>{formatRelativeDate(job.PublishedDate)}</span>
										</div>
									</Paper>
								))}
							</div>
						</div>
					)}

					<div className="rounded-lg bg-white shadow-sm">
						{vacancyQuery.isLoading ? (
							<div className="flex items-center justify-center p-8">
								<CircularProgress />
							</div>
						) : jobs.length === 0 ? (
							<div className="p-8 text-center text-muted">
								{isCandidate
									? getLabel('cur-no-live-jobs', 'Currently there are no live jobs, come back later!')
									: getLabel(
											'cur-no-vac',
											'Currently there are no online vacancies, come back later!'
										)}
							</div>
					) : (
						<div>
							{jobs.map((job) => {
								const showHot = job.IsJobdeskFeatured;
									const showGov = !showHot && job.IsGovernmentJob;
									const showFeatured = !showHot && !showGov && job.IsFeatured;
									return (
										<div
											key={`${job.SourceVacId || job.Id || job.JobUid}`}
											className="flex flex-wrap items-center gap-4 border-b border-divider px-4 py-3 hover:bg-slate-50"
										>
											<div className="flex w-full flex-1 items-center gap-3 md:w-auto">
												<div className="flex h-12 w-12 items-center justify-center rounded border bg-white">
													<img
														src={job.CompanyLogo || '/assets/images/ovlist/c_place_1.png'}
														alt=""
														className="h-8 w-8 rounded"
													/>
												</div>
												<div className="min-w-0">
													<Typography className="truncate font-medium">{job.Title}</Typography>
													<Typography className="truncate text-sm text-muted">{job.CompanyName}</Typography>
													<Typography className="text-xs text-muted">{job.JobTypeText}</Typography>
												</div>
											</div>

											<div className="flex min-w-[120px] items-center gap-1 text-sm text-muted">
												{job.MinSalary || job.MaxSalary ? (
													<>
														<span>{formatCompactNumber(job.MinSalary)}</span>
														{job.MaxSalary && job.MinSalary ? <span>-</span> : null}
														<span>{formatCompactNumber(job.MaxSalary)}</span>
														<span>{job.SalaryCurrency || selectedCurrency}</span>
													</>
												) : (
													'-'
												)}
											</div>

											<div className="flex min-w-[160px] items-center gap-1 text-sm text-muted">
												<FuseSvgIcon size={16}>lucide:map-pin</FuseSvgIcon>
												<span className="truncate">{job.JobLocation || '-'}</span>
											</div>

											<div className="flex min-w-[140px] items-center gap-2 text-sm">
												{showHot && (
													<span className="flex items-center gap-2 text-red-500">
														<img
															src="/assets/icons/job-market/hot-job.svg"
															alt="Hot job"
															className="h-4 w-4"
														/>
														Hot job
													</span>
												)}
												{showGov && (
													<span className="flex items-center gap-2 text-green-500">
														<img
															src="/assets/icons/job-market/government.svg"
															alt="Govt. job"
															className="h-4 w-4"
														/>
														Govt. job
													</span>
												)}
												{showFeatured && (
													<span className="flex items-center gap-2 text-blue-500">
														<img
															src="/assets/icons/job-market/job.svg"
															alt="Featured job"
															className="h-4 w-4"
														/>
														Featured job
													</span>
												)}
												{!showHot && !showGov && !showFeatured && <span>-</span>}
											</div>

											<div className="flex min-w-[120px] items-center text-sm text-muted">
												{formatRelativeDate(job.PublishedDate)}
											</div>

											<div className="ml-auto flex items-center gap-2">
												{isCandidate && job.IsJobdesk && (
													<Button
														size="small"
														variant="contained"
														onClick={(event) => {
															if (profiles.length > 1) {
																setApplyAnchor(event.currentTarget);
																setApplyJob(job);
															} else {
																const profile = profiles[0];
																if (profile) {
																	handleApplyForJob(job, profile);
																}
															}
														}}
													>
														{getLabel('apply', 'Apply')}
													</Button>
												)}
												<IconButton
													size="small"
													onClick={() => (job.IsJobdesk ? handleApplyLink(job) : handleViewSolarJob(job))}
												>
													<FuseSvgIcon>lucide:eye</FuseSvgIcon>
												</IconButton>

												{isCandidate && job.IsJobdesk && (
													<IconButton size="small" onClick={() => handleToggleFavorite(job)}>
														{isFavoriteJob(job) ? <StarIcon color="warning" /> : <StarBorderIcon />}
													</IconButton>
												)}

												<IconButton
													size="small"
													onClick={(event) => {
														setMoreAnchor(event.currentTarget);
														setMoreJob(job);
													}}
												>
													<FuseSvgIcon>lucide:more-vertical</FuseSvgIcon>
												</IconButton>
											</div>
										</div>
									);
								})}
							</div>
						)}
					</div>

					<div ref={autoLoadRef} className="h-px w-full" />

					{jobs.length > 0 && (
						<div className="mt-4 flex items-center justify-between text-sm text-muted">
							{!isCandidate && (
								<Button variant="text" size="small" onClick={() => setInfoDialogOpen(true)}>
									{getLabel('data-sources', 'Data Sources')}
								</Button>
							)}
							<div className="ml-auto flex items-center gap-3">
								{vacancyQuery.isFetchingNextPage ? (
									<span>{getLabel('loading', 'Loading')}...</span>
								) : vacancyQuery.hasNextPage ? (
									<Button size="small" onClick={() => vacancyQuery.fetchNextPage()}>
										{getLabel('scroll-to-load-more', 'Load more')}
									</Button>
								) : null}
								<span>
									{jobs.length}/{totalJobs || jobs.length}
								</span>
							</div>
						</div>
					)}

					<Menu
						anchorEl={salaryAnchor}
						open={Boolean(salaryAnchor)}
						onClose={() => setSalaryAnchor(null)}
						PaperProps={{ className: 'p-4', sx: { width: 320 } }}
					>
						<Typography className="mb-3 text-sm font-medium">
							{getLabel('salary-filter-upper', 'Salary Filter')}
						</Typography>
						<Slider
							value={[minSalary, maxSalary]}
							onChange={(_, value) => {
								if (Array.isArray(value)) {
									setMinSalary(value[0]);
									setMaxSalary(value[1]);
								}
							}}
							min={0}
							max={200000}
							step={100}
							valueLabelDisplay="auto"
							valueLabelFormat={(value) =>
								`${formatCompactNumber(value)} ${selectedCurrency === 'Any' ? '' : selectedCurrency}`
							}
						/>
						<FormControl size="small" fullWidth className="mt-3">
							<Select
								value={selectedCurrency}
								onChange={(event) => setSelectedCurrency(event.target.value as string)}
							>
								{currencies.map((item) => (
									<MenuItem
										key={`${item.Value}-${item.Name || item.ValueText}`}
										value={item.Name || item.ValueText || ''}
									>
										{item.Name || item.ValueText}
									</MenuItem>
								))}
							</Select>
						</FormControl>
						<Button size="small" className="mt-3" onClick={() => setSalaryAnchor(null)}>
							{getLabel('close-upper', 'Close')}
						</Button>
					</Menu>

					<Menu
						anchorEl={sectorAnchor}
						open={Boolean(sectorAnchor)}
						onClose={() => setSectorAnchor(null)}
						PaperProps={{ className: 'p-4', sx: { width: 360 } }}
					>
						<Typography className="mb-3 text-sm font-medium">
							{getLabel('sector-filter-upper', 'Sector Filter')}
						</Typography>
						<Autocomplete
							multiple
							options={sectors}
							getOptionLabel={(option) => option.Name || option.ValueText || ''}
							value={selectedSectors}
							onChange={(_, value) => setSelectedSectors(value)}
							renderTags={(value, getTagProps) =>
								value.map((option, index) => (
									<Chip label={option.Name || option.ValueText} {...getTagProps({ index })} />
								))
							}
							renderInput={(params) => <TextField {...params} placeholder="Select sectors" />}
						/>
					</Menu>

					<Menu
						anchorEl={locationAnchor}
						open={Boolean(locationAnchor)}
						onClose={() => setLocationAnchor(null)}
						PaperProps={{ className: 'p-4', sx: { width: 360 } }}
					>
						<Typography className="mb-3 text-sm font-medium">
							{getLabel('location-filter-upper', 'Location Filter')}
						</Typography>
						<Autocomplete
							multiple
							freeSolo
							options={FILTER_LOCATIONS}
							value={selectedLocations}
							onChange={(_, value) => setSelectedLocations(value)}
							renderTags={(value, getTagProps) =>
								value.map((option, index) => <Chip label={option} {...getTagProps({ index })} />)
							}
							renderInput={(params) => <TextField {...params} placeholder="Add location" />}
						/>
					</Menu>

					<Menu
						anchorEl={companyAnchor}
						open={Boolean(companyAnchor)}
						onClose={() => setCompanyAnchor(null)}
						PaperProps={{ className: 'p-4', sx: { width: 360 } }}
					>
						<Typography className="mb-3 text-sm font-medium">
							{getLabel('company-filter-upper', 'Company Filter')}
						</Typography>
						<Autocomplete
							multiple
							freeSolo
							options={[]}
							value={selectedCompanies}
							onChange={(_, value) => setSelectedCompanies(value)}
							renderTags={(value, getTagProps) =>
								value.map((option, index) => <Chip label={option} {...getTagProps({ index })} />)
							}
							renderInput={(params) => <TextField {...params} placeholder="Add company" />}
						/>
					</Menu>

					<Menu
						anchorEl={typeAnchor}
						open={Boolean(typeAnchor)}
						onClose={() => setTypeAnchor(null)}
						PaperProps={{ className: 'p-4', sx: { width: 360 } }}
					>
						<Typography className="mb-3 text-sm font-medium">
							{getLabel('jobtype-filter-upper', 'Job Type Filter')}
						</Typography>
						<Autocomplete
							multiple
							options={jobTypes}
							getOptionLabel={(option) => option.Name || option.ValueText || ''}
							value={selectedTypes}
							onChange={(_, value) => setSelectedTypes(value)}
							renderTags={(value, getTagProps) =>
								value.map((option, index) => (
									<Chip label={option.Name || option.ValueText} {...getTagProps({ index })} />
								))
							}
							renderInput={(params) => <TextField {...params} placeholder="Select job types" />}
						/>
					</Menu>

					<Menu
						anchorEl={applyAnchor}
						open={Boolean(applyAnchor)}
						onClose={() => {
							setApplyAnchor(null);
							setApplyJob(null);
						}}
					>
						{profiles.length === 0 && <MenuItem disabled>No profiles</MenuItem>}
						{profiles.map((profile) => (
							<MenuItem
								key={profile.Pid}
								onClick={() => {
									if (applyJob) {
										handleApplyForJob(applyJob, profile);
									}
									setApplyAnchor(null);
									setApplyJob(null);
								}}
							>
								{getLabel('apply-width', 'Apply with')} {profile.Title}
							</MenuItem>
						))}
					</Menu>

					<Menu
						anchorEl={moreAnchor}
						open={Boolean(moreAnchor)}
						onClose={() => {
							setMoreAnchor(null);
							setMoreJob(null);
						}}
					>
						{moreJob?.IsJobdesk && (
							<MenuItem
								onClick={() => {
									handleCopyLink(moreJob);
									setMoreAnchor(null);
								}}
							>
								{getLabel('copy-link-upper', 'COPY LINK')}
							</MenuItem>
						)}
						{moreJob?.IsJobdesk && (
							<MenuItem
								onClick={() => {
									handleShareJob(moreJob);
									setMoreAnchor(null);
								}}
							>
								{getLabel('share-upper', 'SHARE')}
							</MenuItem>
						)}
						{isRecruiter && moreJob?.IsJobdesk && userProfile?.Rid !== moreJob?.Rid && (
							<MenuItem
								onClick={() => {
									enqueueSnackbar('Import flow pending migration', { variant: 'info' });
									setMoreAnchor(null);
								}}
							>
								{getLabel('import_upper', 'IMPORT')}
							</MenuItem>
						)}
						{isAdminUser && moreJob?.IsJobdesk && (
							<MenuItem
								onClick={() => {
									handleAdminDeleteVacancy(moreJob);
									setMoreAnchor(null);
								}}
							>
								{getLabel('candidate-generic-delete-label', 'Delete')}
							</MenuItem>
						)}
						{isAdminUser && moreJob && !moreJob.IsJobdesk && !moreJob.IsPro && (
							<MenuItem
								onClick={() => {
									handleMarkSolarJobPro(moreJob);
									setMoreAnchor(null);
								}}
							>
								{getLabel('mark-as-pro', 'MARK AS PRO')}
							</MenuItem>
						)}
						{isAdminUser && moreJob && !moreJob.IsJobdesk && moreJob.IsPro && (
							<MenuItem
								onClick={() => {
									handleUnmarkSolarJobPro(moreJob);
									setMoreAnchor(null);
								}}
							>
								{getLabel('unmark-pro', 'UNMARK PRO')}
							</MenuItem>
						)}
						{isAdminUser && moreJob && !moreJob.IsJobdesk && (
							<MenuItem
								onClick={() => {
									handleDeleteAllJobData(moreJob);
									setMoreAnchor(null);
								}}
							>
								{getLabel('dlt-all-jobs-data', 'DELETE ALL JOBS DATA')}
							</MenuItem>
						)}
						{isAdminUser && moreJob && !moreJob.IsJobdesk && (
							<MenuItem
								onClick={() => {
									handleDeleteJobData(moreJob);
									setMoreAnchor(null);
								}}
							>
								{getLabel('delete-job', 'DELETE JOB')}
							</MenuItem>
						)}
					</Menu>

					<Dialog
						open={preScreenState.open}
						onClose={() => setPreScreenState({ open: false, questions: [], job: null })}
						fullWidth
						maxWidth="sm"
					>
						<DialogTitle>{getLabel('pre-screen', 'Pre-screen questions')}</DialogTitle>
						<DialogContent className="space-y-3">
							{preScreenState.questions.map((question, index) => (
								<TextField
									key={`${question}-${index}`}
									label={question}
									fullWidth
									value={preScreenAnswers[index] || ''}
									onChange={(event) => {
										const next = [...preScreenAnswers];
										next[index] = event.target.value;
										setPreScreenAnswers(next);
									}}
								/>
							))}
						</DialogContent>
						<DialogActions>
							<Button onClick={() => setPreScreenState({ open: false, questions: [], job: null })}>
								{getLabel('cancel-upper', 'Cancel')}
							</Button>
							<Button variant="contained" onClick={handleSubmitPrescreen}>
								{getLabel('apply', 'Apply')}
							</Button>
						</DialogActions>
					</Dialog>

					<Dialog
						open={Boolean(confirmState.open)}
						onClose={() => setConfirmState({ open: false, message: '' })}
					>
						<DialogTitle>{getLabel('confirm-upper', 'Confirm')}</DialogTitle>
						<DialogContent>
							<Typography>{confirmState.message}</Typography>
						</DialogContent>
						<DialogActions>
							<Button onClick={() => setConfirmState({ open: false, message: '' })}>
								{getLabel('cancel-upper', 'Cancel')}
							</Button>
							<Button
								variant="contained"
								onClick={() => {
									confirmState.onConfirm?.();
									setConfirmState({ open: false, message: '' });
								}}
							>
								{getLabel('ok-upper', 'OK')}
							</Button>
						</DialogActions>
					</Dialog>

					<Dialog
						open={shareDialog.open}
						onClose={() => setShareDialog({ open: false, link: '', title: '' })}
						fullWidth
						maxWidth="sm"
					>
						<DialogTitle>{getLabel('share-upper', 'Share')}</DialogTitle>
						<DialogContent className="space-y-3">
							<TextField fullWidth value={shareDialog.link} InputProps={{ readOnly: true }} />
						</DialogContent>
						<DialogActions>
							<Button
								onClick={async () => {
									if (!shareDialog.link) return;
									try {
										await navigator.clipboard.writeText(shareDialog.link);
										enqueueSnackbar(getLabel('link-copied-clipbord', 'Link copied to clipboard!'), {
											variant: 'success'
										});
									} catch {
										enqueueSnackbar(getLabel('link-copied-clipbord', 'Link copied to clipboard!'), {
											variant: 'info'
										});
									}
								}}
							>
								{getLabel('copy-link-upper', 'COPY LINK')}
							</Button>
							<Button
								onClick={() => {
									const subject = encodeURIComponent(shareDialog.title || 'Job');
									const body = encodeURIComponent(shareDialog.link);
									window.location.href = `mailto:?subject=${subject}&body=${body}`;
								}}
							>
								{getLabel('share-upper', 'SHARE')}
							</Button>
							<Button onClick={() => setShareDialog({ open: false, link: '', title: '' })}>
								{getLabel('close-upper', 'Close')}
							</Button>
						</DialogActions>
					</Dialog>

					<Dialog
						open={infoDialogOpen}
						onClose={() => setInfoDialogOpen(false)}
						fullWidth
						maxWidth="sm"
					>
						<DialogTitle>{getLabel('data-sources', 'Data Sources')}</DialogTitle>
						<DialogContent>
							<Typography>
								jobdesk {getLabel('msg-info-modal', 'is using different global data providers to enable you the best possible service. For more details kindly')}{' '}
								<Button
									variant="text"
									size="small"
									onClick={() => (window.location.href = 'mailto:support@jobdesk.com')}
								>
									{getLabel('backend-text-17', 'contact us')}
								</Button>
							</Typography>
						</DialogContent>
						<DialogActions>
							<Button onClick={() => setInfoDialogOpen(false)}>
								{getLabel('close-upper', 'Close')}
							</Button>
						</DialogActions>
					</Dialog>

					<Dialog
						open={solarDialog.open}
						onClose={() =>
							setSolarDialog({ open: false, job: null, loading: false, html: '', sourceUrl: '', sourceKey: '', sourceUid: '' })
						}
						fullWidth
						maxWidth="md"
					>
						<DialogTitle>{solarDialog.job?.Title || getLabel('details-upper', 'Details')}</DialogTitle>
						<DialogContent>
							{solarDialog.loading ? (
								<div className="flex items-center justify-center p-6">
									<CircularProgress />
								</div>
							) : (
								<div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: solarDialog.html || '' }} />
							)}
						</DialogContent>
						<DialogActions>
							{solarDialog.sourceUrl && (
								<Button variant="contained" onClick={() => window.open(solarDialog.sourceUrl, '_blank')}>
									{getLabel('apply', 'Apply')}
								</Button>
							)}
							<Button onClick={() => setSolarDialog({ open: false, job: null, loading: false, html: '', sourceUrl: '', sourceKey: '', sourceUid: '' })}>
								{getLabel('close-upper', 'Close')}
							</Button>
						</DialogActions>
					</Dialog>
				</div>
			}
			scroll={isMobile ? 'page' : 'content'}
		/>
	);
}

export default OnlineVacanciesPageView;
