'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type UIEvent } from 'react';
import FusePageSimple from '@fuse/core/FusePageSimple';
import FuseLoading from '@fuse/core/FuseLoading';
import { styled, useTheme } from '@mui/material/styles';
import {
	Avatar,
	Box,
	Button,
	CircularProgress,
	IconButton,
	LinearProgress,
	Paper,
	ToggleButton,
	ToggleButtonGroup,
	Typography
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import useUser from '@auth/useUser';
import useNavigate from '@fuse/hooks/useNavigate';
import { useSystemData } from '@/contexts/SystemDataContext';
import {
	DashboardCandidateChartResponse,
	DashboardSalesStatisticsResponse,
	DashboardUserConsumptionResponse,
	DashboardVacancyChartResponse,
	DashboardVacancyDataResponse,
	DashboardViewsResponse,
	WeeklyStats,
	getDashboardBsOpporChart,
	getDashboardCandidateChart,
	getDashboardCandidatesAndProfiles,
	getDashboardPendingBuyCandidateList,
	getDashboardPlacementAndSoldProfiles,
	getDashboardSalesStatistics,
	getDashboardUserConsumption,
	getDashboardVacancyChart,
	getDashboardVacancyData
	// getDashboardViews
} from '@/api/services/dashboard';
import { NotificationItem, getNotifications } from '@/api/services/notifications';
import DashboardHeader from '../ui/DashboardHeader';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

const MONTH_LABELS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2].map((year) => `${year}`);

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

function formatBytes(bytes: number, decimals = 2) {
	if (!bytes || bytes === 0) return '0 Bytes';
	const k = 1024;
	const dm = decimals < 0 ? 0 : decimals;
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function toLocalDate(value: unknown): Date | null {
	if (!value) return null;
	if (value instanceof Date) return value;
	const raw = `${value}`;
	const parsed = new Date(raw);
	if (Number.isNaN(parsed.getTime())) return null;
	if (raw.includes('Z') || raw.includes('z') || raw.includes('ZT') || raw.includes('zt')) {
		return parsed;
	}
	const local = new Date();
	local.setUTCFullYear(parsed.getFullYear());
	local.setUTCMonth(parsed.getMonth());
	local.setUTCDate(parsed.getDate());
	local.setUTCHours(parsed.getHours());
	local.setUTCMinutes(parsed.getMinutes());
	local.setUTCSeconds(parsed.getSeconds());
	local.setUTCMilliseconds(parsed.getMilliseconds());
	return local;
}

function formatRelativeDate(value: unknown) {
	const date = toLocalDate(value);
	if (!date) return '';
	return formatDistanceToNow(date, { addSuffix: true });
}

function buildMonthlySeries(views: DashboardViewsResponse | undefined, view: 'Profile' | 'Vacancy', year: string) {
	const source = view === 'Profile' ? views?.ProfileViews : views?.VacancyViews;
	const data = new Array(12).fill(0);
	const yearData = source?.[year] || [];
	yearData.forEach((item) => {
		const month = Number(item?.Month || 0);
		if (month >= 1 && month <= 12) {
			data[month - 1] = Number(item?.Count || 0);
		}
	});
	return data;
}

function buildWeeklySeries(stats: WeeklyStats | undefined, key: 'WeeklyApplicants' | 'WeeklySell') {
	const data = new Array(7).fill(0);
	const map = stats?.[key];
	if (!map) return data;
	const keys = Object.keys(map).map((value) => Number(value));
	if (!keys.length) return data;
	const max = Math.max(...keys);
	let idx = 6;
	for (let i = max; i > max - 7; i -= 1) {
		const entry = map[`${i}`];
		if (entry !== undefined) {
			data[idx] = Number(entry || 0);
		}
		idx -= 1;
	}
	return data;
}

function clampPercent(value?: number) {
	if (value === null || value === undefined || Number.isNaN(Number(value))) return 0;
	return Math.max(0, Math.min(100, Number(value)));
}

type CardHeaderProps = {
	title: string;
	subtitle?: string;
};

function CardHeader({ title, subtitle }: CardHeaderProps) {
	return (
		<div className="flex items-start justify-between">
			<div>
				<Typography className="font-semibold">{title}</Typography>
				{subtitle ? (
					<Typography
						className=""
						color="text.secondary"
					>
						{subtitle}
					</Typography>
				) : null}
			</div>
			<IconButton size="small">
				<MoreVertIcon fontSize="small" />
			</IconButton>
		</div>
	);
}

type SparklineChartProps = {
	data: number[];
	color: string;
};

function SparklineChart({ data, color }: SparklineChartProps) {
	const options = useMemo(
		() => ({
			chart: {
				type: 'area',
				sparkline: { enabled: true },
				toolbar: { show: false }
			},
			stroke: { curve: 'smooth', width: 2 },
			fill: {
				type: 'gradient',
				gradient: {
					shadeIntensity: 1,
					opacityFrom: 0.4,
					opacityTo: 0.05,
					stops: [0, 90, 100]
				}
			},
			colors: [color],
			tooltip: { enabled: false }
		}),
		[color]
	);

	return (
		<ReactApexChart
			type="area"
			height={70}
			options={options}
			series={[{ name: 'value', data }]}
		/>
	);
}

type ProgressRingProps = {
	value: number;
	color: string;
};

function ProgressRing({ value, color }: ProgressRingProps) {
	const theme = useTheme();
	return (
		<Box className="relative inline-flex">
			<CircularProgress
				variant="determinate"
				value={100}
				size={36}
				sx={{
					color: theme.vars.palette.divider
				}}
			/>
			<CircularProgress
				variant="determinate"
				value={clampPercent(value)}
				size={36}
				sx={{
					color,
					position: 'absolute',
					left: 0,
					'top': 0
				}}
			/>
		</Box>
	);
}

type MiniStatCardProps = {
	title: string;
	subtitle: string;
	value: number | string;
	growth: number | null;
	series: number[];
	color: string;
};

function MiniStatCard({ title, subtitle, value, growth, series, color }: MiniStatCardProps) {
	const theme = useTheme();
	const growthValue = growth ?? 0;
	const growthColor = growthValue >= 1 ? theme.vars.palette.success.main : theme.vars.palette.error.main;
	return (
		<Paper className="rounded-xl p-4 shadow-sm">
			<div className="flex flex-col gap-2">
				<Typography className=" font-semibold">{title}</Typography>
				<Typography className="text-sm" color="text.secondary">
					{subtitle}
				</Typography>
			</div>
			<div className="mt-3">
				<SparklineChart
					data={series}
					color={color}
				/>
			</div>
			<div className="mt-2 flex items-center justify-between">
				<Typography className="text-xl font-semibold">{value}</Typography>
				<Typography
					className="text-sm font-semibold"
					sx={{ color: growthColor }}
				>
					{Number.isFinite(growthValue) ? `${growthValue}%` : '--'}
				</Typography>
			</div>
		</Paper>
	);
}

type StatusBadgeProps = {
	label: string;
	variant: 'info' | 'success' | 'warning';
};

function StatusBadge({ label, variant }: StatusBadgeProps) {
	const paletteMap = {
		info: { color: '#7367f0', background: 'rgba(115,103,240,0.12)' },
		success: { color: '#28C76F', background: 'rgba(40,199,111,0.12)' },
		warning: { color: '#ff9f43', background: 'rgba(255,159,67,0.12)' }
	};

	return (
		<Box
			className="rounded-full px-3 py-1 text-sm font-semibold"
			sx={{ color: paletteMap[variant].color, backgroundColor: paletteMap[variant].background }}
		>
			{label}
		</Box>
	);
}

function DashboardPageView() {
	const theme = useTheme();
	const navigate = useNavigate();
	const { data: user, isReady } = useUser();
	const { getLabel } = useSystemData();
	const [selectedView, setSelectedView] = useState<'Profile' | 'Vacancy'>('Profile');
	const [selectedYear, setSelectedYear] = useState<string>(YEAR_OPTIONS[0]);
	const notificationPage = useRef(1);
	const [notifications, setNotifications] = useState<NotificationItem[]>([]);
	const [notificationsLoadingMore, setNotificationsLoadingMore] = useState(false);
	const [notificationsFinished, setNotificationsFinished] = useState(false);

	const accountType = Number((user as any)?.profile?.AccountType ?? user?.accountType ?? 0);
	const isCompany = accountType === 3;
	const isRecruiter = accountType === 1;
	const allowDashboard = isCompany || isRecruiter;

	const t = useCallback((key: string, fallback: string) => getLabel(key, fallback),[getLabel]);

	useEffect(() => {
		if (!isReady || !user) return;
		if (accountType === 2) {
			navigate('/my-profiles');
		} else if (accountType === 4) {
			navigate('/services');
		}
	}, [accountType, isReady, navigate, user]);

	useEffect(() => {
		if (isCompany) {
			setSelectedView('Vacancy');
		}
	}, [isCompany]);

	const { data: viewsData } = useQuery({
		queryKey: ['dashboard', 'views'],
		queryFn: getDashboardBsOpporChart,
		enabled: allowDashboard
	});

	const { data: vacancyData } = useQuery<DashboardVacancyDataResponse>({
		queryKey: ['dashboard', 'vacancyData'],
		queryFn: getDashboardVacancyData,
		enabled: allowDashboard
	});

	const { data: candidatesProfiles } = useQuery({
		queryKey: ['dashboard', 'candidatesProfiles'],
		queryFn: getDashboardCandidatesAndProfiles,
		enabled: isRecruiter
	});

	const { data: placementSold } = useQuery({
		queryKey: ['dashboard', 'placementSold'],
		queryFn: getDashboardPlacementAndSoldProfiles,
		enabled: isRecruiter
	});

	const { data: salesStats } = useQuery<DashboardSalesStatisticsResponse>({
		queryKey: ['dashboard', 'salesStats'],
		queryFn: getDashboardSalesStatistics,
		enabled: isRecruiter
	});

	const { data: vacancyInfo } = useQuery<DashboardVacancyChartResponse>({
		queryKey: ['dashboard', 'vacancyChart'],
		queryFn: getDashboardVacancyChart,
		enabled: allowDashboard
	});

	const { data: candidateInfo } = useQuery<DashboardCandidateChartResponse>({
		queryKey: ['dashboard', 'candidateChart'],
		queryFn: getDashboardCandidateChart,
		enabled: isRecruiter
	});

	const { data: userConsumption } = useQuery<DashboardUserConsumptionResponse>({
		queryKey: ['dashboard', 'userConsumption'],
		queryFn: getDashboardUserConsumption,
		enabled: allowDashboard
	});

	const { data: pendingCandidates } = useQuery({
		queryKey: ['dashboard', 'pendingCandidates'],
		queryFn: getDashboardPendingBuyCandidateList,
		enabled: isRecruiter
	});

	const { data: initialNotifications, isLoading: notificationsLoading } = useQuery({
		queryKey: ['dashboard', 'notifications', 1],
		queryFn: () => getNotifications(1),
		enabled: allowDashboard
	});

	useEffect(() => {
		if (!initialNotifications) return;
		setNotifications(initialNotifications);
		notificationPage.current = 1;
		setNotificationsFinished(initialNotifications.length < 10);
	}, [initialNotifications]);

	const loadMoreNotifications = useCallback(async () => {
		if (notificationsLoadingMore || notificationsFinished) return;
		setNotificationsLoadingMore(true);
		const nextPage = notificationPage.current + 1;
		try {
			const next = await getNotifications(nextPage);
			if (next && next.length > 0) {
				setNotifications((prev) => [...prev, ...next]);
				notificationPage.current = nextPage;
				if (next.length < 10) {
					setNotificationsFinished(true);
				}
			} else {
				setNotificationsFinished(true);
			}
		} finally {
			setNotificationsLoadingMore(false);
		}
	}, [notificationsFinished, notificationsLoadingMore]);

	const handleNotificationsScroll = useCallback(
		(event: UIEvent<HTMLDivElement>) => {
			const target = event.currentTarget;
			if (target.scrollTop + target.clientHeight >= target.scrollHeight - 40) {
				loadMoreNotifications();
			}
		},
		[loadMoreNotifications]
	);

	const analyticsSeries = useMemo(() => {
		const data = buildMonthlySeries(viewsData, selectedView, selectedYear);
		return [{ name: `${selectedView} Views`, data }];
	}, [selectedView, selectedYear, viewsData]);

	const analyticsOptions = useMemo(
		() => ({
			chart: {
				type: 'bar',
				toolbar: { show: false }
			},
			plotOptions: {
				bar: {
					columnWidth: '45%',
					borderRadius: 6
				}
			},
			dataLabels: { enabled: false },
			colors: ['#7367f0'],
			xaxis: {
				categories: MONTH_LABELS,
				labels: { style: { colors: theme.vars.palette.text.secondary } }
			},
			yaxis: {
				labels: { style: { colors: theme.vars.palette.text.secondary } }
			},
			grid: {
				borderColor: theme.vars.palette.divider
			},
			tooltip: {
				y: {
					formatter: (value: number) => `${value}`
				}
			}
		}),
		[theme.vars.palette.divider, theme.vars.palette.text.secondary]
	);

	const storageUsed = Number(userConsumption?.UsedStorage || 0);
	const storageTotal = Number(userConsumption?.TotalStorage || 0);
	const storageAvailable = Number(userConsumption?.AvailableStorage || Math.max(storageTotal - storageUsed, 0));
	const storageUnlimited = storageTotal === -1;
	const storagePercent = storageUnlimited || storageTotal <= 0 ? 0 : Math.round((storageUsed / storageTotal) * 100);

	const storageSeries = useMemo(() => {
		if (storageUnlimited) {
			return [storageUsed, 0];
		}
		return [storageUsed, Math.max(storageTotal - storageUsed, 0)];
	}, [storageTotal, storageUnlimited, storageUsed]);

	const storageOptions = useMemo(
		() => ({
			chart: { type: 'donut' },
			stroke: { width: 0 },
			labels: [t('used-storage', 'Used Storage'), t('avl-storage', 'Free Storage')],
			colors: ['#0D99FF', '#E6F4FF'],
			dataLabels: { enabled: false },
			legend: { show: false }
		}),
		[t]
	);

	const applicantsStats = vacancyData?.ApplicantStatistics;
	const vacanciesStats = vacancyData?.VacancyStatistics;
	const placementsStats = placementSold?.PlacedAplicantStatistics;
	const soldProfilesStats = placementSold?.SoldProfileStatistics;

	const topVacancies = vacancyData?.TopVacancies || [];
	const recentApplicants = vacancyData?.RecentApplicants || [];
	const latestCandidates = (candidatesProfiles as any)?.LatestCandidates || [];
	const mostViewedProfiles =
		(candidatesProfiles as any)?.MostViewdProfiles || (candidatesProfiles as any)?.MostViewedProfiles || [];

	const applicantSeries = buildWeeklySeries(applicantsStats, 'WeeklyApplicants');
	const vacancySeries = buildWeeklySeries(vacanciesStats, 'WeeklyApplicants');
	const placementSeries = buildWeeklySeries(placementsStats, 'WeeklyApplicants');
	const soldSeries = buildWeeklySeries(soldProfilesStats, 'WeeklySell');

	const salesSeries = useMemo(() => {
		const data = new Array(12).fill(0);
		const yearly = salesStats?.ThisYearView || {};
		Object.values(yearly).forEach((items) => {
			items?.forEach((entry) => {
				const month = Number(entry?.Month || 0);
				if (month >= 1 && month <= 12) {
					data[month - 1] = Number(entry?.Count || 0);
				}
			});
		});
		return [{ name: 'Sales', data }];
	}, [salesStats]);

	const salesOptions = useMemo(
		() => ({
			// chart: { type: 'area', toolbar: { show: false }, sparkline: { enabled: false } },
			// stroke: { curve: 'smooth', width: 2 },
			// fill: { type: 'gradient', gradient: { opacityFrom: 0.4, opacityTo: 0.05 } },
			// colors: ['#28C76F'],
			// dataLabels: { enabled: false },
			// xaxis: { categories: MONTH_LABELS },
			// tooltip: { enabled: false }
			chart: { 
            type: 'area', 
            toolbar: { show: false },
            // Disable sparkline to show axes/labels
            sparkline: { enabled: false }, 
            fontFamily: 'Roboto, Helvetica, Arial, sans-serif',
        },
        stroke: { curve: 'smooth', width: 2 },
        fill: { 
            type: 'gradient', 
            gradient: { opacityFrom: 0.4, opacityTo: 0.05 } 
        },
        colors: ['#28C76F'],
        dataLabels: { enabled: false },
        xaxis: { 
            categories: MONTH_LABELS, // Ensure this array has 12 names
            labels: {
                show: true,
                style: { colors: '#64748b', fontSize: '12px' }
            },
            axisBorder: { show: false },
            axisTicks: { show: false }
        },
        yaxis: { show: false }, // Keep Y-axis hidden for a clean look
        grid: { show: false },  // Hide background lines
        tooltip: { 
            enabled: true,
            theme: 'light',
            x: { show: true }
        }
		}),
		[]
	);

	const renderStars = useCallback((rating?: number) => {
		const normalized = Number(rating || 0);
		const filled = normalized > 0 ? Math.round(normalized) : 0;
		const empty = 5 - filled;
		const stars: React.ReactNode[] = [];
		if (filled > 0) {
			for (let i = 0; i < filled; i += 1) {
				stars.push(
					<img
						key={`full-${i}`}
						src="/assets/icons/dashboard/star-fill.png"
						alt="star"
						className="h-3 w-3"
					/>
				);
			}
			for (let i = 0; i < empty; i += 1) {
				stars.push(
					<img
						key={`empty-${i}`}
						src="/assets/icons/dashboard/star-fill2.png"
						alt="star"
						className="h-3 w-3"
					/>
				);
			}
		} else {
			for (let i = 0; i < 5; i += 1) {
				stars.push(
					<img
						key={`muted-${i}`}
						src="/assets/icons/dashboard/star-fill3.png"
						alt="star"
						className="h-3 w-3"
					/>
				);
			}
		}
		return <div className="flex items-center gap-1">{stars}</div>;
	}, []);

	const getPendingStatusText = useCallback(
		(item: any) => {
			if (item?.PriceOption === 2) {
				return t('prof-lead', 'Profile Lead');
			}
			if (item?.Status === 1) {
				return t('buy-profile-status', 'Buy Profile');
			}
			if (item?.Status === 2) {
				return t('declined', 'Declined');
			}
			if (item?.Status === 3) {
				return t('pending-status', 'Pending');
			}
			return '';
		},
		[t]
	);

	const getPendingBadgeVariant = useCallback((item: any): 'info' | 'success' | 'warning' => {
		if (item?.PriceOption === 2) {
			return 'info';
		}
		if (item?.Status === 3) {
			return 'warning';
		}
		return 'success';
	}, []);

	const getNotificationColor = useCallback((index: number) => {
		const colors = ['#28C76F', '#EA5455', '#FF9F43', '#00CFE8', '#7367F0', '#9C27B0', '#4B5563'];
		return colors[index % colors.length];
	}, []);

	if (!isReady || !user) {
		return <FuseLoading />;
	}

	if (!allowDashboard) {
		return <FuseLoading />;
	}

	return (
		<Root
			header={<DashboardHeader />}
			content={
				<div className="grid w-full grid-cols-1 gap-6 py-6 lg:grid-cols-12">
					<Paper className="rounded-2xl p-6 shadow-sm lg:col-span-8">
						<div className="flex flex-col gap-4">
							<div className="flex flex-wrap items-start justify-between gap-4">
								<div>
									<Typography className="font-semibold">
										{t('analytics-reports', 'Analytics Reports')}
									</Typography>
									<Typography
										className=""
										color="text.secondary"
									>
										{t('yearly-overview', 'Yearly Overview')}
									</Typography>
								</div>
								<div className="flex items-center gap-2">
									{!isCompany && (
										<ToggleButtonGroup
											size="small"
											value={selectedView}
											exclusive
											onChange={(_, value) => value && setSelectedView(value)}
										>
											<ToggleButton value="Profile">{t('profile-views', 'Profile Views')}</ToggleButton>
											<ToggleButton value="Vacancy">{t('vacancy-views', 'Vacancy Views')}</ToggleButton>
										</ToggleButtonGroup>
									)}
									<div className="flex items-center gap-2">
										{YEAR_OPTIONS.map((year) => (
											<Button
												key={year}
												size="small"
												variant={selectedYear === year ? 'contained' : 'outlined'}
												onClick={() => setSelectedYear(year)}
											>
												{year}
											</Button>
										))}
									</div>
								</div>
							</div>
							<div className="mt-2">
								<ReactApexChart
									type="bar"
									height={280}
									options={analyticsOptions}
									series={analyticsSeries}
								/>
							</div>
						</div>
					</Paper>

					<Paper className="rounded-2xl p-6 shadow-sm lg:col-span-4">
						<div className="flex flex-col gap-4">
							<CardHeader
								title={t('usr-consumption', 'User Consumption')}
								subtitle={t('lst-mnt', 'Last Month')}
							/>
							<div className="rounded-xl border border-transparent bg-slate-50 p-4">
								<div className="flex items-center justify-between gap-4">
									<div>
										<Typography className="text-base font-semibold">
											{t('home-price-storage-ttl', 'Storage')}
										</Typography>
										<Typography className="mt-3  font-semibold text-blue-600">
											{formatBytes(storageUsed * 1048576)} /{' '}
											{storageUnlimited
												? t('unli-sm', 'Unlimited')
												: formatBytes(storageTotal * 1048576)}
										</Typography>
										<Typography className="text-sm" color="text.secondary">
											{formatBytes(storageAvailable * 1048576)} {t('avl-storage', 'Free Storage')}
										</Typography>
									</div>
									<div className="relative flex items-center justify-center">
										<ReactApexChart
											type="donut"
											height={140}
											options={storageOptions}
											series={storageSeries}
										/>
										<div className="absolute text-base font-semibold">
											{storageUnlimited ? t('unli-sm', 'Unlimited') : `${storagePercent}%`}
										</div>
									</div>
								</div>
							</div>
							<div className="rounded-xl border border-transparent bg-white p-4 shadow-sm">
								<Typography className=" font-semibold">
									{t('cv-parsing', 'CV Parsing')}
								</Typography>
								<div className="mt-4">
									<Typography className="">
										{t('basic-parsing-imit', 'Free Basic Parsing Limit')}{' '}
										<span className="font-semibold text-blue-600">{t('unli-sm', 'Unlimited')}</span>
									</Typography>
									<Typography className="text-sm" color="text.secondary">
										{t('dash-cal-month', 'Calculated monthly')}
									</Typography>
								</div>
							</div>
							<div className="mt-2 flex flex-col gap-3">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<img
											src="/assets/icons/dashboard/pink-wave.svg"
											alt="wave"
											className="h-6 w-6"
										/>
										<Typography className="">
											{t('free-full-parse-limit', 'Free Full Parsing Limit')}
										</Typography>
									</div>
									<Typography className=" font-semibold">
										{userConsumption?.FullLimit === -1
											? t('unli-sm', 'Unlimited')
											: userConsumption?.FullLimit ?? 0}
									</Typography>
								</div>
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<img
											src="/assets/icons/dashboard/blue-wave.svg"
											alt="wave"
											className="h-6 w-6"
										/>
										<Typography className="">
											{t('used-basic-parsing', 'Used Basic Parsing')}
										</Typography>
									</div>
									<Typography className=" font-semibold">{userConsumption?.UsedBasic ?? 0}</Typography>
								</div>
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<img
											src="/assets/icons/dashboard/green-wave.svg"
											alt="wave"
											className="h-6 w-6"
										/>
										<Typography className="">
											{t('used-full-parsing', 'Used Full Parsing')}
										</Typography>
									</div>
									<Typography className=" font-semibold">{userConsumption?.UsedFull ?? 0}</Typography>
								</div>
							</div>
						</div>
					</Paper>

					<div className="lg:col-span-2">
						<MiniStatCard
							title={t('applicants', 'Applicants')}
							subtitle={t('this-month-upper', 'THIS MONTH')}
							value={applicantsStats?.LastTotalCount ?? 0}
							growth={applicantsStats?.GrowthRate ?? 0}
							series={applicantSeries}
							color="#28C76F"
						/>
					</div>

					<div className="lg:col-span-2">
						<MiniStatCard
							title={t('placements', 'Placements')}
							subtitle={t('this-month-upper', 'THIS MONTH')}
							value={placementsStats?.LastTotalCount ?? 0}
							growth={placementsStats?.GrowthRate ?? 0}
							series={placementSeries}
							color="#7367F0"
						/>
					</div>

					<div className="lg:col-span-2">
						{isCompany ? (
							<MiniStatCard
								title={t('vacancies', 'Vacancies')}
								subtitle={t('this-month-upper', 'THIS MONTH')}
								value={vacanciesStats?.LastTotalCount ?? 0}
								growth={vacanciesStats?.GrowthRate ?? 0}
								series={vacancySeries}
								color="#00CFE8"
							/>
						) : (
							<MiniStatCard
								title={t('profiles-sold', 'Profiles Sold')}
								subtitle={t('this-month-upper', 'THIS MONTH')}
								value={soldProfilesStats?.LastTotalCount ?? 0}
								growth={soldProfilesStats?.GrowthRate ?? 0}
								series={soldSeries}
								color="#00CFE8"
							/>
						)}
					</div>

					{isCompany ? (
						<Paper className="rounded-2xl p-6 shadow-sm lg:col-span-6">
							<CardHeader
								title={t('vac-stat', 'Vacancy Statistics')}
								subtitle={`${vacancyInfo?.TotalVacancies ?? 0} ${t('total-vac-upper', 'TOTAL VACANCIES')}`}
							/>
							<div className="mt-6 flex flex-col gap-4">
								<div className="flex items-center justify-between gap-4">
									<Typography className="">{t('open-vacancies', 'Open Vacancies')}</Typography>
									<div className="flex w-2/3 items-center gap-3">
										<LinearProgress
											variant="determinate"
											value={clampPercent(vacancyInfo?.OpenVacPercent)}
											sx={{
												height: 8,
												borderRadius: 999,
												backgroundColor: theme.vars.palette.divider,
												'& .MuiLinearProgress-bar': { backgroundColor: '#EA5455' }
											}}
										/>
										<Typography className=" font-semibold">
											{clampPercent(vacancyInfo?.OpenVacPercent).toFixed(1)}%
										</Typography>
									</div>
								</div>
								<div className="flex items-center justify-between gap-4">
									<Typography className="">{t('short-listed', 'Shortlisted')}</Typography>
									<div className="flex w-2/3 items-center gap-3">
										<LinearProgress
											variant="determinate"
											value={clampPercent(vacancyInfo?.ShortListPercent)}
											sx={{
												height: 8,
												borderRadius: 999,
												backgroundColor: theme.vars.palette.divider,
												'& .MuiLinearProgress-bar': { backgroundColor: '#7367F0' }
											}}
										/>
										<Typography className=" font-semibold">
											{clampPercent(vacancyInfo?.ShortListPercent).toFixed(1)}%
										</Typography>
									</div>
								</div>
								<div className="flex items-center justify-between">
									<Typography className="">{t('total-applicants', 'Total Applicants')}</Typography>
									<Typography className=" font-semibold">{vacancyInfo?.TotalApplicants ?? 0}</Typography>
								</div>
							</div>
						</Paper>
					) : (
						<Paper className="rounded-2xl p-6 shadow-sm lg:col-span-6">
							<CardHeader title={t('sales-value', 'Sales Value')} subtitle={t('this-year', 'This year')} />
							<div className="mt-4 flex items-end gap-4">
								<div className="text-left pb-4">
									<Typography variant="h6" className="font-bold">
										{salesStats?.ThisMonth || 0}
									</Typography>
									<Typography 
										variant="caption" 
										className={salesStats?.GrowthRate >= 0 ? "text-green-600" : "text-red-600"}
									>
										({salesStats?.GrowthRate || 0}%)
									</Typography>
								</div>
								<div className='flex-1'>
									<ReactApexChart
										type="area"
										height={160}
										options={salesOptions}
										series={salesSeries}
									/>
								</div>
							</div>
						</Paper>
					)}

					<Paper className="rounded-2xl p-6 shadow-sm lg:col-span-4">
						<CardHeader title={t('notifications', 'Notifications')} />
						{notificationsLoading ? (
							<div className="flex h-48 items-center justify-center">
								<CircularProgress size={24} />
							</div>
						) : notifications.length ? (
							<div
								className="mt-4 max-h-96 overflow-y-auto pr-2"
								onScroll={handleNotificationsScroll}
							>
								{notifications.map((item: any, index: number) => (
									<div
										key={`${item?.ID || 'n'}-${index}`}
										className="flex items-start gap-3 pb-4"
									>
										<div className="mt-1 flex flex-col items-center">
											<span
												className="h-3 w-3 rounded-full"
												style={{ backgroundColor: getNotificationColor(index) }}
											></span>
											{index < notifications.length - 1 && (
												<span className="mt-1 h-8 w-px bg-slate-200"></span>
											)}
										</div>
										<div className="flex flex-1 items-start justify-between gap-4">
											<div>
												<Typography className=" font-semibold">
													{item?.Title || t('notifications', 'Notifications')}
												</Typography>
												<Typography className="" color="text.secondary">
													{item?.Body || item?.Message || ''}
												</Typography>
											</div>
											<div className="flex flex-col items-end gap-2">
												<Typography className="text-sm" color="text.secondary">
													{formatRelativeDate(item?.Sent || item?.Created)}
												</Typography>
											</div>
										</div>
									</div>
								))}
								{notificationsLoadingMore && (
									<div className="flex items-center justify-center py-4">
										<CircularProgress size={20} />
									</div>
								)}
							</div>
						) : (
							<div className="flex flex-col items-center justify-center gap-3 py-12">
								<Typography className=" font-semibold" color="primary">
									{t('no-notifications', 'No Notifications found')}
								</Typography>
								<img
									src="/assets/images/dashboard/notification.png"
									alt="No notifications"
									className="h-20 w-auto"
								/>
							</div>
						)}
					</Paper>

					{isRecruiter && (
						<Paper className="rounded-2xl p-6 shadow-sm lg:col-span-4">
							<CardHeader
								title={t('cand-stat', 'Candidate Statistics')}
								subtitle={`${candidateInfo?.TotalCandidates ?? 0} ${t('total-candi-upper', 'Total Candidates')}`}
							/>
							<div className="mt-6 flex flex-col gap-4">
								<div className="flex items-center justify-between gap-4">
									<div>
										<Typography className="">{t('total-avail-candi', 'Total Available Candidates')}</Typography>
										<div className="flex items-center gap-1 text-sm text-slate-500">
											{candidateInfo?.AvailableCandidatesPercentage >= 50 ? (
												<TrendingUpIcon fontSize="small" color="success" />
											) : (
												<TrendingDownIcon fontSize="small" color="error" />
											)}
											{clampPercent(candidateInfo?.AvailableCandidatesPercentage).toFixed(1)}%
										</div>
									</div>
									<div className="flex items-center gap-3">
										<Typography className=" font-semibold">
											{candidateInfo?.AvailableCandidates ?? 0}
										</Typography>
										<ProgressRing value={clampPercent(candidateInfo?.AvailableCandidatesPercentage)} color="#4d5bf9" />
									</div>
								</div>
								<div className="flex items-center justify-between gap-4">
									<div>
										<Typography className="">{t('new-candidates', 'New Candidates')}</Typography>
										<div className="flex items-center gap-1 text-sm text-slate-500">
											{candidateInfo?.NewCandidatesPercentage >= 50 ? (
												<TrendingUpIcon fontSize="small" color="success" />
											) : (
												<TrendingDownIcon fontSize="small" color="error" />
											)}
											{clampPercent(candidateInfo?.NewCandidatesPercentage).toFixed(1)}%
										</div>
									</div>
									<div className="flex items-center gap-3">
										<Typography className=" font-semibold">{candidateInfo?.NewCandidates ?? 0}</Typography>
										<ProgressRing value={clampPercent(candidateInfo?.NewCandidatesPercentage)} color="#28C76F" />
									</div>
								</div>
								<div className="flex items-center justify-between gap-4">
									<div>
										<Typography className="">{t('looking-for', 'Looking For')}</Typography>
										<div className="flex items-center gap-1 text-sm text-slate-500">
											{candidateInfo?.LookingForPercentage >= 50 ? (
												<TrendingUpIcon fontSize="small" color="success" />
											) : (
												<TrendingDownIcon fontSize="small" color="error" />
											)}
											{clampPercent(candidateInfo?.LookingForPercentage).toFixed(1)}%
										</div>
									</div>
									<div className="flex items-center gap-3">
										<Typography className=" font-semibold">{candidateInfo?.LookingForCount ?? 0}</Typography>
										<ProgressRing value={clampPercent(candidateInfo?.LookingForPercentage)} color="#0D99FF" />
									</div>
								</div>
								<div className="flex items-center justify-between">
									<Typography className="">{t('occupied', 'Not available')}</Typography>
									<Typography className=" font-semibold">{candidateInfo?.OccupiedCount ?? 0}</Typography>
								</div>
								<div className="flex items-center justify-between">
									<Typography className="">{t('open-to-request', 'Open To Request')}</Typography>
									<Typography className=" font-semibold">{candidateInfo?.OpenToRequestCount ?? 0}</Typography>
								</div>
							</div>
						</Paper>
					)}

					{isRecruiter && (
						<Paper className="rounded-2xl p-6 shadow-sm lg:col-span-4">
							<CardHeader
								title={t('vac-stat', 'Vacancy Statistics')}
								subtitle={`${vacancyInfo?.TotalVacancies ?? 0} ${t('total-vac-upper', 'Total Statistics')}`}
							/>
							<div className="mt-6 flex flex-col gap-4">
								<div className="flex items-center justify-between gap-4">
									<Typography className="">{t('open-vacancies', 'Open Vacancies')}</Typography>
									<div className="flex w-2/3 items-center gap-3">
										<LinearProgress
											variant="determinate"
											value={clampPercent(vacancyInfo?.OpenVacPercent)}
											sx={{
												height: 8,
												borderRadius: 999,
												backgroundColor: theme.vars.palette.divider,
												'& .MuiLinearProgress-bar': { backgroundColor: '#EA5455' }
											}}
										/>
										<Typography className=" font-semibold">
											{clampPercent(vacancyInfo?.OpenVacPercent).toFixed(1)}%
										</Typography>
									</div>
								</div>
								<div className="flex items-center justify-between gap-4">
									<Typography className="">{t('short-listed', 'Shortlisted')}</Typography>
									<div className="flex w-2/3 items-center gap-3">
										<LinearProgress
											variant="determinate"
											value={clampPercent(vacancyInfo?.ShortListPercent)}
											sx={{
												height: 8,
												borderRadius: 999,
												backgroundColor: theme.vars.palette.divider,
												'& .MuiLinearProgress-bar': { backgroundColor: '#7367F0' }
											}}
										/>
										<Typography className=" font-semibold">
											{clampPercent(vacancyInfo?.ShortListPercent).toFixed(1)}%
										</Typography>
									</div>
								</div>
								<div className="flex items-center justify-between">
									<Typography className="">{t('total-applicants', 'Total Applicants')}</Typography>
									<Typography className=" font-semibold">{vacancyInfo?.TotalApplicants ?? 0}</Typography>
								</div>
							</div>
						</Paper>
					)}

					<Paper className="rounded-2xl p-6 shadow-sm lg:col-span-4">
						<CardHeader title={t('top-vacancies', 'Top Vacancies')} />
						{topVacancies.length ? (
							<div className="mt-4 max-h-96 overflow-y-auto pr-2">
								{topVacancies.map((vacancy: any, index: number) => (
									<div key={`${vacancy?.Id || index}`} className="flex items-center justify-between gap-4 pb-4">
										<div>
											<Typography className=" font-semibold">{vacancy?.Title}</Typography>
											<Typography className="text-sm" color="text.secondary">
												{vacancy?.TotalApplicants ?? 0} {t('applicants', 'Applicants')}
											</Typography>
										</div>
										<Typography className="text-sm" color="text.secondary">
											{vacancy?.Views ?? 0} {t('views', 'View')}
										</Typography>
									</div>
								))}
							</div>
						) : (
							<div className="flex flex-col items-center justify-center gap-3 py-12">
								<Typography className=" font-semibold" color="primary">
									{t('no-vacancies-found', 'No vacancies found!')}
								</Typography>
								<img
									src="/assets/images/dashboard/no_vacancies_found.png"
									alt="No vacancies"
									className="h-20 w-auto"
								/>
							</div>
						)}
					</Paper>

					<Paper className="rounded-2xl p-6 shadow-sm lg:col-span-4">
						<CardHeader title={t('recent-applicants', 'Recent Applicants')} />
						{recentApplicants.length ? (
							<div className="mt-4 max-h-96 overflow-y-auto pr-2">
								{recentApplicants.map((row: any, index: number) => (
									<div key={`${row?.Id || index}`} className="flex items-center justify-between gap-4 pb-4">
										<div className="flex items-center gap-3">
											<Avatar
												src={row?.Applicant?.ProfileImage || '/assets/icons/dashboard/avatar_img.png'}
												alt="avatar"
												sx={{ width: 40, height: 40 }}
											/>
											<div>
												<Typography className=" font-semibold">
													{row?.Applicant?.FirstName} {row?.Applicant?.LastName}
												</Typography>
												<Typography className="text-sm" color="text.secondary">
													{row?.VacancyTitle}
												</Typography>
											</div>
										</div>
										<Typography className="text-sm" color="text.secondary">
											{formatRelativeDate(row?.Applicant?.ApplicationDate)}
										</Typography>
									</div>
								))}
							</div>
						) : (
							<div className="flex flex-col items-center justify-center gap-3 py-12">
								<Typography className=" font-semibold" color="primary">
									{t('no-applicants-found', 'No applicants found!')}
								</Typography>
								<img
									src="/assets/images/dashboard/no_applicants_found.png"
									alt="No applicants"
									className="h-20 w-auto"
								/>
							</div>
						)}
					</Paper>

					{isRecruiter && (
						<Paper className="rounded-2xl p-6 shadow-sm lg:col-span-4">
							<CardHeader title={t('latest-candidates', 'Latest Candidates')} />
							{latestCandidates.length ? (
								<div className="mt-4 max-h-96 overflow-y-auto pr-2">
									{latestCandidates.map((candidate: any, index: number) => (
										<div key={`${candidate?.Id || index}`} className="flex items-center justify-between gap-4 pb-4">
											<div className="flex items-center gap-3">
												<Avatar
													src={candidate?.ProfilePic || '/assets/icons/dashboard/avatar_img.png'}
													alt="avatar"
													sx={{ width: 40, height: 40 }}
												/>
												<div>
													<Typography className=" font-semibold">
														{candidate?.FirstName} {candidate?.LastName}
													</Typography>
													<Typography className="text-sm" color="text.secondary">
														{candidate?.Profession}
													</Typography>
												</div>
											</div>
											<Typography className="text-sm" color="text.secondary">
												{formatRelativeDate(candidate?.Created)}
											</Typography>
										</div>
									))}
								</div>
							) : (
								<div className="flex flex-col items-center justify-center gap-3 py-12">
									<Typography className=" font-semibold" color="primary">
										{t('no-candidates-found', 'No Candidates found')}
									</Typography>
									<img
										src="/assets/images/dashboard/no_candidates_found.png"
										alt="No candidates"
										className="h-20 w-auto"
									/>
								</div>
							)}
						</Paper>
					)}

					{isRecruiter && (
						<Paper className="rounded-2xl p-6 shadow-sm lg:col-span-6">
							<CardHeader title={t('most-viewed-profiles', 'Most Viewed Profiles')} />
							{mostViewedProfiles.length ? (
								<div className="mt-4 max-h-96 overflow-y-auto pr-2">
									{mostViewedProfiles.map((profile: any, index: number) => (
										<div key={`${profile?.Id || index}`} className="flex items-center justify-between gap-4 pb-4">
											<div className="flex items-center gap-3">
												<Avatar
													src={profile?.ProfilePicture || '/assets/icons/dashboard/avatar_img.png'}
													alt="avatar"
													sx={{ width: 40, height: 40 }}
												/>
												<div>
													<Typography className=" font-semibold">{profile?.Title}</Typography>
													{renderStars(profile?.Rating)}
												</div>
											</div>
											<Typography className="text-sm" color="text.secondary">
												{profile?.Views ?? 0} {t('views', 'Views')}
											</Typography>
										</div>
									))}
								</div>
							) : (
								<div className="flex flex-col items-center justify-center gap-3 py-12">
									<Typography className=" font-semibold" color="primary">
										{t('no-profiles-found', 'No profiles found!')}
									</Typography>
									<img
										src="/assets/images/dashboard/no_profiles_found.png"
										alt="No profiles"
										className="h-20 w-auto"
									/>
								</div>
							)}
						</Paper>
					)}

					{isRecruiter && (
						<Paper className="rounded-2xl p-6 shadow-sm lg:col-span-6">
							<CardHeader title={t('pending-candidates', 'Pending Candidates')} />
							{pendingCandidates && (pendingCandidates as any[]).length ? (
								<div className="mt-4 max-h-96 overflow-y-auto pr-2">
									{(pendingCandidates as any[]).map((candidate, index) => (
										<div key={`${candidate?.Id || index}`} className="flex items-center justify-between gap-4 pb-4">
											<div>
												<Typography
													className=" font-semibold"
													onClick={() => candidate?.Puid && navigate(`/candidates/profiles/${candidate.Puid}`)}
													component="span"
													sx={{ cursor: candidate?.Puid ? 'pointer' : 'default' }}
												>
													{candidate?.Title}
												</Typography>
												<Typography className="text-sm" color="text.secondary">
													{candidate?.Occupation || candidate?.ProfileTageLine || ''}
												</Typography>
												<div className="mt-2 flex items-center gap-2">
													{renderStars(candidate?.Rating)}
													{getPendingStatusText(candidate) ? (
														<StatusBadge
															label={getPendingStatusText(candidate)}
															variant={getPendingBadgeVariant(candidate)}
														/>
													) : null}
												</div>
											</div>
											<Typography className="text-sm" color="text.secondary">
												{formatRelativeDate(candidate?.CreateDate)}
											</Typography>
										</div>
									))}
								</div>
							) : (
								<div className="flex flex-col items-center justify-center gap-3 py-12">
									<Typography className=" font-semibold" color="primary">
										{t('no-candidates-found', 'No Candidates found')}
									</Typography>
									<img
										src="/assets/images/dashboard/no_pending_candidates_found.png"
										alt="No pending candidates"
										className="h-20 w-auto"
									/>
								</div>
							)}
						</Paper>
					)}
				</div>
			}
		/>
	);
}

export default DashboardPageView;
