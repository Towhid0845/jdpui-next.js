'use client';

import { useEffect, useMemo, useState } from 'react';
import FusePageSimple from '@fuse/core/FusePageSimple';
import FuseLoading from '@fuse/core/FuseLoading';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { styled } from '@mui/material/styles';
import {
	Alert,
	Autocomplete,
	Button,
	Chip,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	InputBase,
	Paper,
	TextField,
	ToggleButton,
	ToggleButtonGroup,
	Typography,
	Avatar, 
	Divider, 
	IconButton 
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import useUser from '@auth/useUser';
import useThemeMediaQuery from '@fuse/hooks/useThemeMediaQuery';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import { useSystemData } from '@/contexts/SystemDataContext';
import { getOnlineVacancyChart, getOnlineVacancy } from '@/api/services/vacancies';
import type { TypeInfoItem } from '@/api/services/typeInfos';

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

type JobItem = {
	VacId?: number;
	Title?: string;
	CompanyName?: string;
	CompanyLogo?: string;
	JobLocation?: string;
	JobTypeText?: string;
	MinSalary?: number;
	MaxSalary?: number;
	SalaryCurrency?: string;
	Sector?: string;
	PublishedDate?: string;
	DeadLine?: string;
	IsJobdesk?: boolean;
	IsFeatured?: boolean;
	Description?: string;
	ApplyLink?: string;
	[key: string]: unknown;
};

type JobListResponse = {
	Result?: JobItem[];
	Paging?: {
		TotalItems?: number;
		PageNumber?: number;
		PageSize?: number;
		TotalPages?: number;
	};
	[key: string]: unknown;
};

function formatDate(value?: string) {
	if (!value) return '—';

	try {
		return formatDistanceToNow(new Date(value), { addSuffix: true });
	} catch {
		return value;
	}
}

// function JobDetailDialog({ job, open, onClose }: { job: JobItem | null; open: boolean; onClose: () => void }) {
// 	if (!job) return null;

// 	return (
// 		<Dialog
// 			open={open}
// 			onClose={onClose}
// 			maxWidth="sm"
// 			fullWidth
// 		>
// 			<DialogTitle>{job.Title}</DialogTitle>
// 			<DialogContent dividers>
// 				<div className="flex flex-col gap-3">
// 					{job.CompanyName && (
// 						<Typography
// 							variant="body2"
// 							color="text.secondary"
// 						>
// 							{job.CompanyName}
// 						</Typography>
// 					)}
// 					<div className="flex flex-wrap gap-2">
// 						{job.JobLocation && (
// 							<Chip
// 								label={job.JobLocation}
// 								size="small"
// 								icon={<FuseSvgIcon size={14}>lucide:map-pin</FuseSvgIcon>}
// 							/>
// 						)}
// 						{job.JobTypeText && (
// 							<Chip
// 								label={job.JobTypeText}
// 								size="small"
// 							/>
// 						)}
// 						{job.Sector && (
// 							<Chip
// 								label={job.Sector}
// 								size="small"
// 							/>
// 						)}
// 					</div>
// 					{(job.MinSalary || job.MaxSalary) && (
// 						<Typography variant="body2">
// 							Salary: {job.SalaryCurrency || ''} {job.MinSalary?.toLocaleString() || '0'} –{' '}
// 							{job.MaxSalary?.toLocaleString() || '0'}
// 						</Typography>
// 					)}
// 					{job.DeadLine && (
// 						<Typography
// 							variant="body2"
// 							color="text.secondary"
// 						>
// 							Deadline: {new Date(job.DeadLine).toLocaleDateString('en-GB')}
// 						</Typography>
// 					)}
// 					{job.Description && (
// 						<div
// 							className="prose prose-sm max-w-none"
// 							dangerouslySetInnerHTML={{ __html: job.Description }}
// 						/>
// 					)}
// 				</div>
// 			</DialogContent>
// 			<DialogActions>
// 				<Button onClick={onClose}>Close</Button>
// 				{job.ApplyLink && (
// 					<Button
// 						variant="contained"
// 						href={job.ApplyLink}
// 						target="_blank"
// 					>
// 						Apply
// 					</Button>
// 				)}
// 			</DialogActions>
// 		</Dialog>
// 	);
// }



function JobDetailDialog({ job, open, onClose }: { job: any | null; open: boolean; onClose: () => void }) {
    if (!job) return null;

    // Handle the placeholder infinite deadline from the API
    const isInfiniteDeadline = job.DeadLine?.startsWith('9999');
    const displayDeadline = isInfiniteDeadline 
        ? 'Open until filled' 
        : new Date(job.DeadLine).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            scroll="paper"
            PaperProps={{ className: "rounded-xl font-public-sans" }}
        >
            <DialogTitle className="flex items-start justify-between p-6 pb-4">
                <div className="flex gap-4 ">
                    <Avatar
                        src={job.CompanyLogo}
                        variant="rounded"
                        className="w-[110px] h-auto [&_img]:object-contain border bg-gray-50 shadow-sm px-3"
                    >
                        {job.CompanyName?.[0]}
                    </Avatar>
                    <div className="flex flex-col">
                        <Typography variant="h6" className="font-bold leading-tight text-blue-900">
                            {job.Title}
                        </Typography>
                        <Typography variant="subtitle2" color="primary" className="font-medium">
                            {job.CompanyName}
                        </Typography>
                    </div>
                </div>
                <IconButton onClick={onClose} size="small" className="-mt-2 -mr-2">
                    <FuseSvgIcon size={20}>lucide:x</FuseSvgIcon>
                </IconButton>
            </DialogTitle>

            <DialogContent className="px-6 py-4">
                {/* Quick Info Grid */}
                <div className="grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-4 mb-6">
                    <div className="flex items-center gap-2">
                        <FuseSvgIcon size={18} className="text-gray-400">lucide:map-pin</FuseSvgIcon>
                        <div>
                            <Typography variant="caption" className="block text-gray-400 uppercase font-bold">Location</Typography>
                            <Typography variant="body2">{job.JobLocation || 'Not Specified'}</Typography>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <FuseSvgIcon size={18} className="text-gray-400">lucide:calendar</FuseSvgIcon>
                        <div>
                            <Typography variant="caption" className="block text-gray-400 uppercase font-bold">Deadline</Typography>
                            <Typography variant="body2">{displayDeadline}</Typography>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <FuseSvgIcon size={18} className="text-gray-400">lucide:banknote</FuseSvgIcon>
                        <div>
                            <Typography variant="caption" className="block text-gray-400 uppercase font-bold">Salary</Typography>
                            <Typography variant="body2">
                                {job.MaxSalary > 0 
                                    ? `${job.SalaryCurrency || 'BDT'} ${job.MinSalary || 0} - ${job.MaxSalary}`
                                    : 'Negotiable'}
                            </Typography>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <FuseSvgIcon size={18} className="text-gray-400">lucide:briefcase</FuseSvgIcon>
                        <div>
                            <Typography variant="caption" className="block text-gray-400 uppercase font-bold">Source</Typography>
                            <Typography variant="body2" className="capitalize">{job.Source || 'Direct'}</Typography>
                        </div>
                    </div>
                </div>

                {/* Tags/Categories */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {job.IsUrgent && (
                        <Chip label="Urgent" size="small" color="error" variant="filled" className="font-bold" />
                    )}
                    {job.JobTypeText && <Chip label={job.JobTypeText} size="small" variant="outlined" />}
                    {job.IsVerifiedCompany && (
                        <Chip 
                            label="Verified Company" 
                            size="small" 
                            color="success" 
                            variant="outlined" 
                            icon={<FuseSvgIcon size={14}>lucide:check-circle</FuseSvgIcon>}
                        />
                    )}
                </div>

                <Divider className="mb-4" />

                {/* Job Description */}
                <Typography variant="subtitle1" className="font-bold mb-2">Job Description</Typography>
                {job.Description ? (
                    <div
                        className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: job.Description }}
                    />
                ) : (
                    <Typography variant="body2" color="text.secondary" className="italic">
                        No detailed description provided. Please visit the apply link for more details.
                    </Typography>
                )}
            </DialogContent>

            <DialogActions className="p-6 pt-2">
                <Button onClick={onClose} className="font-bold text-gray-500">
                    Maybe Later
                </Button>
                {job.ApplyLink && (
                    <Button
                        variant="contained"
                        href={job.ApplyLink}
                        target="_blank"
                        className="bg-[#1e4e79] hover:bg-[#163a5a] px-8 py-2 rounded-md font-bold capitalize shadow-none"
                        startIcon={<FuseSvgIcon size={18}>lucide:external-link</FuseSvgIcon>}
                    >
                        Apply on {job.Source || 'Site'}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
}

function JobMarketPageView() {
	const { isReady } = useUser();
	const { typeInfos, isReady: systemReady } = useSystemData();
	const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down('lg'));

	const [searchText, setSearchText] = useState('');
	const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
	const [selectedSectors, setSelectedSectors] = useState<number[]>([]);
	const [selectedFilter, setSelectedFilter] = useState<string>('all');
	const [pageNumber, setPageNumber] = useState(0);
	const [pageSize] = useState(20);
	const [detailJob, setDetailJob] = useState<JobItem | null>(null);

	const sectors = useMemo(() => typeInfos['System.Sector'] || [], [typeInfos]);
	const sectorNames = useMemo(
		() => sectors.map((s: TypeInfoItem) => s.Name || s.ValueText || '').filter(Boolean),
		[sectors]
	);
	const countries = useMemo(() => typeInfos['System.Country'] || [], [typeInfos]);
	const countryNames = useMemo(
		() => countries.map((c: TypeInfoItem) => c.Name || c.ValueText || '').filter(Boolean),
		[countries]
	);

	const searchPayload = useMemo(
		() => ({
			PageSize: pageSize,
			PageNumber: pageNumber + 1,
			SearchText: searchText || undefined,
			Filter: selectedFilter === 'all' ? undefined : selectedFilter,
			Locations: selectedLocations.length ? selectedLocations : undefined,
			SectorIds: selectedSectors.length ? selectedSectors : undefined
		}),
		[pageSize, pageNumber, searchText, selectedFilter, selectedLocations, selectedSectors]
	);

	const {
		data: jobData,
		isLoading,
		error
	} = useQuery({
		queryKey: ['job-market', searchPayload],
		queryFn: () => getOnlineVacancy(searchPayload) as Promise<JobListResponse>,
		enabled: isReady && systemReady
	});

	const { data: chartData } = useQuery({
		queryKey: ['online-vacancy-chart'],
		queryFn: getOnlineVacancyChart,
		enabled: isReady
	});

	const jobs = useMemo(() => {
		const result = jobData?.Jobs || (Array.isArray(jobData) ? (jobData as JobItem[]) : []);
		return result;
	}, [jobData]);
	const totalItems = jobData?.Paging?.TotalItems || 0;
	const totalPages = Math.ceil(totalItems / pageSize) || 1;

	useEffect(() => {
		setPageNumber(0);
	}, [searchText, selectedFilter, selectedLocations, selectedSectors]);

	if (!isReady) {
		return <FuseLoading />;
	}

	return (
		<Root
			header={
				<div className="flex flex-col gap-4 p-6">
					<div className="flex flex-col gap-1">
						<Typography variant="h6">Job Market</Typography>
						<PageBreadcrumb />
					</div>

					{/* Stats Cards */}
					{chartData && (
						<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
							<Paper
								className="flex items-center gap-3 rounded-lg p-4 border-b-2 border-b-blue-600"
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
										{chartData.totalJobs ?? 0}
									</Typography>
									<Typography
										variant="caption"
										color="text.secondary"
									>
										Total Jobs
									</Typography>
								</div>
							</Paper>
							<Paper
								className="flex items-center gap-3 rounded-lg p-4 border-b-2 border-b-green-600"
								variant="outlined"
							>
								<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-50">
									<FuseSvgIcon
										className="text-green-600"
										size={24}
									>
										lucide:calendar
									</FuseSvgIcon>
								</div>
								<div>
									<Typography
										className="text-2xl font-semibold"
										color="text.primary"
									>
										{chartData.totalJobsToday ?? 0}
									</Typography>
									<Typography
										variant="caption"
										color="text.secondary"
									>
										Jobs Today
									</Typography>
								</div>
							</Paper>
							<Paper
								className="flex items-center gap-3 rounded-lg p-4 border-b-2 border-b-red-600"
								variant="outlined"
							>
								<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-50">
									<FuseSvgIcon
										className="text-red-600"
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
										{chartData.totalRecruiterJobs ?? 0}
									</Typography>
									<Typography
										variant="caption"
										color="text.secondary"
									>
										Recruiter Jobs
									</Typography>
								</div>
							</Paper>
							<Paper
								className="flex items-center gap-3 rounded-lg p-4 border-b-2 border-b-amber-600"
								variant="outlined"
							>
								<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-50">
									<FuseSvgIcon
										className="text-amber-600"
										size={24}
									>
										lucide:building
									</FuseSvgIcon>
								</div>
								<div>
									<Typography
										className="text-2xl font-semibold"
										color="text.primary"
									>
										{chartData.totalCompanyJobs ?? 0}
									</Typography>
									<Typography
										variant="caption"
										color="text.secondary"
									>
										Company Jobs
									</Typography>
								</div>
							</Paper>
						</div>
					)}

					{/* Filters */}
					<div className="flex flex-wrap items-end gap-3">
						<Paper
							className="flex items-center rounded-full px-3 py-1"
							variant="outlined"
						>
							<FuseSvgIcon size={18}>lucide:search</FuseSvgIcon>
							<InputBase
								className="ml-2 flex-1"
								placeholder="Search jobs..."
								value={searchText}
								onChange={(e) => setSearchText(e.target.value)}
							/>
						</Paper>
						<Autocomplete
							multiple
							size="small"
							options={countryNames}
							value={selectedLocations}
							onChange={(_, value) => setSelectedLocations(value)}
							renderInput={(params) => (
								<TextField
									{...params}
									placeholder="Location"
									variant="outlined"
								/>
							)}
							className="min-w-[200px]"
							limitTags={2}
						/>
						<Autocomplete
							multiple
							size="small"
							options={sectorNames}
							value={selectedSectors.map((id) => {
								const match = sectors.find((s: TypeInfoItem) => s.Value === id);
								return match?.Name || match?.ValueText || '';
							})}
							onChange={(_, value) => {
								setSelectedSectors(
									value
										.map((name) => {
											const match = sectors.find(
												(s: TypeInfoItem) => (s.Name || s.ValueText) === name
											);
											return match?.Value;
										})
										.filter((v): v is number => v !== undefined)
								);
							}}
							renderInput={(params) => (
								<TextField
									{...params}
									placeholder="Sector"
									variant="outlined"
								/>
							)}
							className="min-w-[200px]"
							limitTags={2}
						/>
						<ToggleButtonGroup
							value={selectedFilter}
							exclusive
							onChange={(_, v) => {
								if (v !== null) setSelectedFilter(v);
							}}
							size="small"
						>
							<ToggleButton value="all">All</ToggleButton>
							<ToggleButton value="vacancy">Vacancies</ToggleButton>
							<ToggleButton value="matching">Matching</ToggleButton>
						</ToggleButtonGroup>
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
						<Alert severity="error">Failed to load jobs.</Alert>
					) : jobs.length === 0 ? (
						<div className="flex flex-col items-center gap-4 py-16">
							<FuseSvgIcon
								size={48}
								className="text-gray-400"
							>
								lucide:briefcase
							</FuseSvgIcon>
							<Typography color="text.secondary">No jobs found.</Typography>
						</div>
					) : (
						<>
							<div className="flex flex-col gap-3">
								{jobs.map((job, idx) => (
									<Paper
										key={job.VacId || idx}
										className="cursor-pointer rounded-xl border p-4 transition-shadow hover:bg-sky-100 hover:shadow-md"
										variant="outlined"
										onClick={() => setDetailJob(job)}
									>
										<div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
											<div className="flex items-center gap-2">
												{job.CompanyLogo ? (
													<img
														src={job.CompanyLogo}
														alt={job.CompanyName || 'Company Logo'}
														className="h-8 w-8 rounded-full object-cover"
													/>
												) : (
													<div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
														<FuseSvgIcon
															size={16}
															className="text-gray-500"
														>
															lucide:building
														</FuseSvgIcon>
													</div>
												)}
											</div>
											<div className="flex flex-col gap-1 mr-auto">
												<div className="flex items-center gap-2">
													<Typography className="font-medium">
														{job.Title || 'Untitled'}
													</Typography>
													{job.IsFeatured && (
														<Chip
															label="Featured"
															size="small"
															color="primary"
															variant="outlined"
														/>
													)}
												</div>
												{job.CompanyName && (
													<Typography
														variant="body2"
														color="text.secondary"
													>
														{job.CompanyName}
													</Typography>
												)}
												<div className="flex flex-wrap items-center gap-2 text-sm">
													{job.JobLocation && (
														<div className="flex items-center gap-1">
															<FuseSvgIcon
																size={14}
																className="text-gray-500"
															>
																lucide:map-pin
															</FuseSvgIcon>
															<Typography
																variant="caption"
																color="text.secondary"
															>
																{job.JobLocation}
															</Typography>
														</div>
													)}
													{job.JobTypeText && (
														<Chip
															label={job.JobTypeText}
															size="small"
															variant="outlined"
														/>
													)}
													{job.Sector && (
														<Chip
															label={job.Sector}
															size="small"
															variant="outlined"
														/>
													)}
												</div>
											</div>
											<div className="flex flex-col items-end gap-1">
												{(job.MinSalary || job.MaxSalary) && (
													<Typography
														variant="body2"
														className="font-medium"
													>
														{job.SalaryCurrency || ''}{' '}
														{job.MinSalary?.toLocaleString() || '0'} –{' '}
														{job.MaxSalary?.toLocaleString() || '0'}
													</Typography>
												)}
												{job.PublishedDate && (
													<Typography
														variant="caption"
														color="text.secondary"
													>
														{formatDate(job.PublishedDate)}
													</Typography>
												)}
											</div>
										</div>
									</Paper>
								))}
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

					<JobDetailDialog
						job={detailJob}
						open={Boolean(detailJob)}
						onClose={() => setDetailJob(null)}
					/>
				</div>
			}
			scroll={isMobile ? 'page' : 'content'}
		/>
	);
}

export default JobMarketPageView;
