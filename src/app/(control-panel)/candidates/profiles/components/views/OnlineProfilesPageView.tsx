'use client';

import { useEffect, useMemo, useState } from 'react';
import FusePageSimple from '@fuse/core/FusePageSimple';
import FuseLoading from '@fuse/core/FuseLoading';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import useNavigate from '@fuse/hooks/useNavigate';
import { styled } from '@mui/material/styles';
import {
	Alert,
	Autocomplete,
	Avatar,
	Button,
	Chip,
	CircularProgress,
	InputBase,
	Paper,
	Rating,
	TextField,
	Typography
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import useUser from '@auth/useUser';
import useThemeMediaQuery from '@fuse/hooks/useThemeMediaQuery';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import { useSystemData } from '@/contexts/SystemDataContext';
import { searchProfiles } from '@/api/services/profiles';
import { getBasicChartForSearch } from '@/api/services/dashboard';

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

function StatCard({
	icon,
	iconBg,
	iconColor,
	value,
	label,
	percentage
}: {
	icon: string;
	iconBg: string;
	iconColor: string;
	value: number;
	label: string;
	percentage?: number;
}) {
	return (
		<Paper
			className="flex items-center gap-3 rounded-lg p-4"
			variant="outlined"
		>
			<div className={`flex h-12 w-12 items-center justify-center rounded-lg ${iconBg}`}>
				<FuseSvgIcon
					className={iconColor}
					size={24}
				>
					{icon}
				</FuseSvgIcon>
			</div>
			<div>
				<Typography
					className="text-2xl font-semibold"
					color="text.primary"
				>
					{value?.toLocaleString() || 0}
				</Typography>
				<Typography
					variant="caption"
					color="text.secondary"
				>
					{label}
					{percentage !== undefined && percentage > 0 && ` (${percentage}%)`}
				</Typography>
			</div>
		</Paper>
	);
}

function OnlineProfilesPageView() {
	const { isReady } = useUser();
	const { typeInfos, isReady: systemReady } = useSystemData();
	const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down('lg'));

	const [searchText, setSearchText] = useState('');
	const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
	const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
	const [pageNumber, setPageNumber] = useState(0);
	const [pageSize] = useState(20);

	const countries = useMemo(() => typeInfos['System.Country'] || [], [typeInfos]);
	const languages = useMemo(() => typeInfos['System.Language'] || [], [typeInfos]);
	const countryNames = useMemo(() => countries.map((c) => c.Name || c.ValueText || '').filter(Boolean), [countries]);
	const languageNames = useMemo(() => languages.map((l) => l.Name || l.ValueText || '').filter(Boolean), [languages]);
	const navigate = useNavigate();

	const searchPayload = useMemo(
		() => ({
			PageSize: pageSize,
			PageNumber: pageNumber,
			SearchText: searchText || undefined,
			Countries: selectedCountries.length
				? selectedCountries
						.map((name) => {
							const match = countries.find((c) => (c.Name || c.ValueText) === name);
							return match?.Value;
						})
						.filter(Boolean)
				: undefined,
			Languages: selectedLanguages.length
				? selectedLanguages
						.map((name) => {
							const match = languages.find((l) => (l.Name || l.ValueText) === name);
							return match?.Value;
						})
						.filter(Boolean)
				: undefined
		}),
		[pageSize, pageNumber, searchText, selectedCountries, selectedLanguages, countries, languages]
	);

	const {
		data: profileData,
		isLoading: profilesLoading,
		error: profilesError
	} = useQuery({
		queryKey: ['profile-search', searchPayload],
		queryFn: () => searchProfiles(searchPayload),
		enabled: isReady && systemReady
	});

	const { data: chartData } = useQuery({
		queryKey: ['candidate-chart'],
		// queryFn: getDashboardCandidateChart,
		queryFn: getBasicChartForSearch,
		enabled: isReady
	});

	const profiles = useMemo(() => profileData?.Result || [], [profileData]);
	// const totalItems = profileData?.Paging?.TotalItems || 0;
	const totalItems = profileData?.Count || 0;
	const totalPages = Math.ceil(totalItems / pageSize);


	useEffect(() => {
		setPageNumber(0);
	}, [searchText, selectedCountries, selectedLanguages]);

	if (!isReady) {
		return <FuseLoading />;
	}

	return (
		<Root
			header={
				<div className="flex flex-col gap-4 p-6">
					<div className="flex flex-col gap-1">
						<Typography variant="h6">Online Profiles</Typography>
						<PageBreadcrumb />
					</div>

					{/* Stats Cards */}
					{chartData && (
						<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
							<StatCard
								icon="lucide:user-circle"
								iconBg="bg-blue-50"
								iconColor="text-blue-600"
								value={chartData.AvailableCandidates ?? 0}
								label="Available Profiles"
								percentage={chartData.AvailableCandidatesPercentage}
							/>
							<StatCard
								icon="lucide:briefcase"
								iconBg="bg-green-50"
								iconColor="text-green-600"
								value={chartData.LookingForCount ?? 0}
								label="Looking for a Job"
								percentage={chartData.LookingForPercentage}
							/>
							<StatCard
								icon="lucide:user-plus"
								iconBg="bg-amber-50"
								iconColor="text-amber-600"
								value={chartData.NewCandidates ?? 0}
								label="New Profiles"
								percentage={chartData.NewCandidatesPercentage}
							/>
							<StatCard
								icon="lucide:users"
								iconBg="bg-indigo-50"
								iconColor="text-indigo-600"
								value={chartData.TotalCandidates ?? 0}
								label="Total Profiles"
							/>
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
								placeholder="Search profiles..."
								value={searchText}
								onChange={(e) => setSearchText(e.target.value)}
							/>
						</Paper>
						<Autocomplete
							multiple
							size="small"
							options={countryNames}
							value={selectedCountries}
							onChange={(_, value) => setSelectedCountries(value)}
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
							options={languageNames}
							value={selectedLanguages}
							onChange={(_, value) => setSelectedLanguages(value)}
							renderInput={(params) => (
								<TextField
									{...params}
									placeholder="Languages"
									variant="outlined"
								/>
							)}
							className="min-w-[200px]"
							limitTags={2}
						/>
					</div>
				</div>
			}
			content={
				<div className="p-6">
					{profilesLoading ? (
						<div className="flex items-center justify-center p-12">
							<CircularProgress />
						</div>
					) : profilesError ? (
						<Alert severity="error">Failed to load profiles.</Alert>
					) : profiles.length === 0 ? (
						<div className="flex flex-col items-center gap-4 py-16">
							<FuseSvgIcon
								size={48}
								className="text-gray-400"
							>
								lucide:search
							</FuseSvgIcon>
							<Typography color="text.secondary">No profiles found.</Typography>
						</div>
					) : (
						<>
							{/* <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
								{profiles.map((profile) => {
									const displayName =
										profile.FullName ||
										`${profile.FirstName || ''} ${profile.LastName || ''}`.trim() ||
										'Unknown';
									return (
										<Paper
											key={profile.Puid}
											className="flex flex-col gap-3 rounded-xl border p-4"
											variant="outlined"
											onClick={() => {
												navigate(`/candidates/profiles/${profile.Puid}`);
											}}
										>
											<div className="flex items-start gap-3">
												<Avatar
													src={profile.ProfileImage || undefined}
													className="h-12 w-12"
												>
													{displayName[0]?.toUpperCase()}
												</Avatar>
												<div className="flex flex-1 flex-col">
													<div className="flex items-center gap-2">
														<Typography className="font-medium">{displayName}</Typography>
														{profile.IsVerified && (
															<FuseSvgIcon
																size={16}
																color="success"
															>
																lucide:badge-check
															</FuseSvgIcon>
														)}
													</div>
													{profile.Title && (
														<Typography
															variant="body2"
															color="text.secondary"
															className="line-clamp-1"
														>
															{profile.Title}
														</Typography>
													)}
												</div>
											</div>

											{profile.Skills && profile.Skills.length > 0 && (
												<div className="flex flex-wrap gap-1">
													{profile.Skills.slice(0, 4).map((skill, i) => (
														<Chip
															key={i}
															label={skill}
															size="small"
															variant="outlined"
														/>
													))}
													{profile.Skills.length > 4 && (
														<Chip
															label={`+${profile.Skills.length - 4}`}
															size="small"
														/>
													)}
												</div>
											)}

											<div className="flex items-center justify-between">
												<div className="flex items-center gap-2">
													{profile.Country && (
														<Typography
															variant="caption"
															color="text.secondary"
														>
															{profile.Country}
														</Typography>
													)}
													{profile.Rating !== undefined && profile.Rating > 0 && (
														<Rating
															value={profile.Rating}
															precision={0.5}
															size="small"
															readOnly
														/>
													)}
												</div>
												{profile.Salary !== undefined && profile.Salary > 0 && (
													<Typography
														variant="body2"
														className="font-medium"
													>
														{profile.SalaryCurrency || ''}{' '}
														{profile.Salary?.toLocaleString()}
													</Typography>
												)}
											</div>

											{profile.AvailabilityStatusText && (
												<Chip
													label={profile.AvailabilityStatusText}
													size="small"
													color={
														profile.AvailabilityStatus === 1
															? 'success'
															: profile.AvailabilityStatus === 2
																? 'warning'
																: 'default'
													}
													variant="outlined"
												/>
											)}
										</Paper>
									);
								})}
							</div> */}
							<div className="flex flex-col gap-1 border-t border-x overflow-hidden rounded-lg">
								{profiles.map((profile) => {
									const displayName =
										profile.FullName ||
										`${profile.FirstName || ''} ${profile.LastName || ''}`.trim() ||
										'Unknown';
										
									// Helper to format the relative time (e.g., "1 m ago")
									const getRelativeTime = (dateString?: string) => {
										if (!dateString) return '-';
										const date = new Date(dateString);
										const now = new Date();
										const diffInMonths = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
										return diffInMonths <= 0 ? '1 m ago' : `${diffInMonths} m ago`;
									};

									return (
										<Paper
											key={profile.Puid}
											className="group flex flex-row items-center gap-4 rounded-none border-b p-4 transition-colors hover:bg-gray-50"
											variant="elevation"
											elevation={0}
											onClick={() => {
												navigate(`/candidates/profiles/${profile.Puid}`);
											}}
										>
											{/* 1. Avatar Section */}
											<div className="relative shrink-0">
												<Avatar
													src={profile.ProfilePicture || undefined}
													className="h-12 w-12 border shadow-sm"
												>
													{displayName[0]?.toUpperCase()}
												</Avatar>
												<div className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${profile.AvailabilityStatus === 1 ? 'bg-green-500' : 'bg-orange-500'}`} />
											</div>

											{/* 2. Info Section (Title & Rating) */}
											<div className="flex w-1/4 flex-col gap-0.5">
												<Typography className="truncate font-semibold text-blue-900">
													{profile.Title || displayName}
												</Typography>
												<div className="flex items-center gap-1">
													<Rating
														value={profile.Rating || 0}
														size="small"
														readOnly
														sx={{ fontSize: '0.875rem' }}
													/>
													<Typography variant="caption" color="text.secondary">
														({profile.RatingCount || 0})
													</Typography>
												</div>
											</div>

											{/* 3. Verification Status */}
											<div className="flex flex-1 items-center justify-center">
												<div className="flex items-center gap-1.5 rounded-md px-2 py-1">
													<FuseSvgIcon size={18} color={profile.IsVerified || profile.IsEmailVerified ? "success" : "disabled"}>
														lucide:mail-check
													</FuseSvgIcon>
													<Typography 
														variant="body2" 
														className={`font-medium ${profile.IsVerified || profile.IsEmailVerified ? "text-green-600" : "text-gray-400"}`}
													>
														Verified
													</Typography>
												</div>
											</div>

											{/* 4. Date Section */}
											<div className="flex flex-1 justify-center">
												<Typography variant="body2" color="text.secondary">
													{profile.AvailableFrom ? new Date(profile.AvailableFrom).toLocaleDateString('en-US', {
														year: 'numeric',
														month: 'short',
														day: 'numeric'
													}) : '-'}
												</Typography>
											</div>

											{/* 5. Salary Section */}
											<div className="flex flex-1 justify-center">
												<Typography variant="body2" className="font-medium text-gray-700">
													{profile.MinExpectedSalary 
														? `${(profile.MinExpectedSalary / 1000).toFixed(0)}K ${profile.MinExpectedSalaryCurrency || 'BDT'}` 
														: '-'}
												</Typography>
											</div>

											{/* 6. Relative Time */}
											<div className="flex flex-1 justify-center">
												<Typography variant="body2" color="text.secondary">
													{getRelativeTime(profile.AvailableFrom)}
												</Typography>
											</div>

											{/* 7. Action Section */}
											<div className="flex shrink-0 items-center pl-4">
												<button 
													className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-50 text-pink-500 transition-colors hover:bg-pink-100"
													onClick={(e) => e.stopPropagation()}
												>
													<FuseSvgIcon size={18}>lucide:heart</FuseSvgIcon>
												</button>
											</div>
										</Paper>
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
				</div>
			}
			scroll={isMobile ? 'page' : 'content'}
		/>
	);
}

export default OnlineProfilesPageView;
