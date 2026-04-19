'use client';

import { useMemo } from 'react';
import FusePageSimple from '@fuse/core/FusePageSimple';
import FuseLoading from '@fuse/core/FuseLoading';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { styled } from '@mui/material/styles';
import { Alert, Avatar, Button, Chip, CircularProgress, Divider, Paper, Rating, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import useNavigate from '@fuse/hooks/useNavigate';
import useUser from '@auth/useUser';
import useThemeMediaQuery from '@fuse/hooks/useThemeMediaQuery';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import { getPublishedProfile } from '@/api/services/profiles';

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

function SectionTitle({ children }: { children: React.ReactNode }) {
	return (
		<Typography
			variant="subtitle1"
			className="mb-2 font-semibold"
		>
			{children}
		</Typography>
	);
}

type ProfileDetailPageViewProps = {
	puid: string;
};

function ProfileDetailPageView({ puid }: ProfileDetailPageViewProps) {
	const { isReady } = useUser();
	const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down('lg'));
	const navigate = useNavigate();

	const {
		data: profile,
		isLoading,
		error
	} = useQuery({
		queryKey: ['published-profile', puid],
		queryFn: () => getPublishedProfile(puid),
		enabled: isReady && Boolean(puid)
	});

	const displayName = useMemo(() => {
		if (!profile) return '';

		return profile.FullName || `${profile.FirstName || ''} ${profile.LastName || ''}`.trim() || 'Unknown';
	}, [profile]);

	if (!isReady) {
		return <FuseLoading />;
	}

	return (
		<Root
			header={
				<div className="flex items-center gap-4 p-6">
					<Button
						variant="text"
						startIcon={<FuseSvgIcon>lucide:arrow-left</FuseSvgIcon>}
						onClick={() => navigate('/candidates/profiles')}
					>
						Back
					</Button>
					<div className="flex flex-col gap-1">
						<Typography variant="h6">{'Profile Detail'}</Typography>
						<PageBreadcrumb />
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
						<Alert severity="error">Failed to load profile.</Alert>
					) : !profile ? (
						<Alert severity="warning">Profile not found.</Alert>
					) : (
						<>
							<Paper className="flex flex-col gap-6 rounded-xl p-6 md:flex-row md:items-center mb-5" variant="outlined">
								{/* Avatar */}
								<Avatar
									src={profile.ProfilePicture || undefined}
									variant="rounded"
									className="h-24 w-24 rounded-lg border bg-gray-50"
								>
									{displayName[0]?.toUpperCase()}
								</Avatar>

								{/* Main Info Area */}
								<div className="flex flex-1 flex-col gap-3">
									<div className="flex items-center justify-between">
										<Typography variant="h6" className="font-bold text-gray-800">
											{profile.Title || displayName}
										</Typography>

										{/* Verified Badge (Top Right) */}
										<div className="flex items-center gap-1 rounded bg-green-50 px-2 py-0.5 text-green-600 border border-green-100">
											<FuseSvgIcon size={16}>lucide:badge-check</FuseSvgIcon>
											<Typography variant="caption" className="font-bold">Verified</Typography>
										</div>
									</div>

									{/* Stats Row with Vertical Dividers */}
									<div className="flex flex-wrap items-center gap-4 text-gray-600">
										<div>
											<Typography variant="body2" className="font-bold">
												{profile.MinExpectedSalary} {profile.MinExpectedSalaryCurrency}/Monthly
											</Typography>
											<Typography variant="caption" className="text-gray-400">Expected Salary</Typography>
										</div>

										<Divider orientation="vertical" flexItem className="hidden md:block h-8 self-center" />

										<div className="flex items-center gap-2">
											<FuseSvgIcon size={18}>lucide:trending-up</FuseSvgIcon>
											<Typography variant="body2" className="font-medium">Looking for a job</Typography>
										</div>

										<Divider orientation="vertical" flexItem className="hidden md:block h-8 self-center" />

										<div className="flex items-center gap-2 text-blue-700">
											<FuseSvgIcon size={18}>lucide:map-pin</FuseSvgIcon>
											<Typography variant="body2" className="font-medium">{profile.Nationality || 'Anywhere'}</Typography>
										</div>

										{/* Spacer to push rating to the end */}
										<div className="flex-1" />

										<div className="flex flex-col items-end">
											<Rating value={profile.Rating || 0} readOnly size="small" />
											<Typography variant="caption" color="text.secondary">({profile.RatingCount || 0})</Typography>
										</div>
									</div>

									{/* Action Buttons Row */}
									<div className="flex flex-wrap items-center gap-3 mt-2">
										<Button
											variant="contained"
											color="primary"
											className="bg-[#1e4e79] hover:bg-[#163a5a] px-6 py-2 rounded-md capitalize"
											startIcon={<FuseSvgIcon size={18}>lucide:check</FuseSvgIcon>}
										>
											Buy Profile ({profile.SalePrice} {profile.SaleCurrency})
										</Button>

										<div className="flex-1 md:hidden" />

										<div className="flex gap-2 ml-auto">
											<Button
												variant="outlined"
												size="medium"
												className="text-blue-500 border-blue-500 hover:bg-blue-50 capitalize"
												startIcon={<FuseSvgIcon size={18}>lucide:thumbs-up</FuseSvgIcon>}
											>
												Like
											</Button>
											<Button
												variant="outlined"
												size="medium"
												className="text-pink-500 border-pink-500 hover:bg-pink-50 capitalize"
												startIcon={<FuseSvgIcon size={18}>lucide:heart</FuseSvgIcon>}
											>
												Favorite
											</Button>
										</div>
									</div>
								</div>
							</Paper>
							
							<div className="mx-auto grid grid-cols-12 gap-6 font-public-sans">

								{/* LEFT SIDEBAR (Col span 4) */}
								<div className="col-span-12 flex flex-col gap-6 md:col-span-4">

									{/* Languages & Nationality */}
									<Paper className="rounded-xl p-6" variant="outlined">
										<div className="mb-6">
											<SectionTitle>
												<div className="flex items-center gap-2"><FuseSvgIcon size={20}>lucide:user</FuseSvgIcon> About</div>
											</SectionTitle>
											<div className="mt-4 space-y-4">
												<div>
													<Typography variant="caption" className="font-bold text-gray-400">Languages</Typography>
													<Typography variant="body2">{profile.Languages?.join(', ') || '-'}</Typography>
												</div>
												<div>
													<Typography variant="caption" className="font-bold text-gray-400">Nationality</Typography>
													<Typography variant="body2">{profile.Nationality || '-'}</Typography>
												</div>
											</div>
										</div>
									</Paper>

									{/* Skills with Star Ratings */}
									<Paper className="rounded-xl p-6" variant="outlined">
										<SectionTitle>
											<div className="flex items-center gap-2"><FuseSvgIcon size={20}>lucide:lightbulb</FuseSvgIcon> Skills</div>
										</SectionTitle>
										<div className="mt-4 divide-y">
											{profile.Skills?.map((skill) => (
												<div key={skill.ProfileSkillId} className="flex items-center justify-between py-3">
													<Typography variant="body2" className="pr-4 text-gray-700">{skill.Name}</Typography>
													<Rating value={skill.Rating} readOnly size="small" />
												</div>
											))}
										</div>
									</Paper>

									{/* Certificates */}
									<Paper className="rounded-xl p-6" variant="outlined">
										<SectionTitle>
											<div className="flex items-center gap-2"><FuseSvgIcon size={20}>lucide:scroll-text</FuseSvgIcon> Certificates</div>
										</SectionTitle>
										<div className="mt-4 space-y-4">
											{profile.Certificates?.map((cert) => (
												<div key={cert.ID} className="flex flex-col">
													<div className="flex items-center gap-2">
														<div className="h-2 w-2 rounded-full bg-green-500" />
														<Typography variant="body2" className="font-medium">{cert.CertificationName}</Typography>
													</div>
													{cert.DoesNotExpire && (
														<Typography variant="caption" className="pl-4 text-gray-400">- Does not expire</Typography>
													)}
												</div>
											))}
										</div>
									</Paper>
								</div>

								{/* MAIN CONTENT (Col span 8) */}
								<div className="col-span-12 flex flex-col gap-6 md:col-span-8">

									{/* Career Objective (from Assessmentses) */}
									{profile.Assessmentses?.map((assessment) => (
										<Paper key={assessment.ProfileAssessmentId} className="rounded-xl p-6" variant="outlined">
											<SectionTitle>
												<div className="flex items-center gap-2 text-blue-600">
													<FuseSvgIcon size={20}>lucide:flag</FuseSvgIcon> {assessment.Title}
												</div>
											</SectionTitle>
											<div
												className="text-sm text-gray-600"
												dangerouslySetInnerHTML={{ __html: assessment.Text }}
											/>
										</Paper>
									))}

									{/* Professional Experience */}
									<Paper className="rounded-xl p-6" variant="outlined">
										<SectionTitle>
											<div className="flex items-center gap-2 text-blue-600">
												<FuseSvgIcon size={20}>lucide:briefcase</FuseSvgIcon> Professional Experiences
											</div>
										</SectionTitle>
										<div className="mt-4 space-y-6">
											{profile.ProfessionalExperiences?.map((exp) => (
												<div key={exp.ProfileProfessionalExperienceId} className="relative pl-6">
													<div className="absolute left-0 top-1.5 h-2 w-2 rounded-full bg-green-500" />
													<Typography className="font-bold">{exp.WorkTitle}</Typography>
													<Typography variant="body2" className="text-gray-500">{exp.Description}</Typography>
													<Typography variant="caption" className="mt-1 block text-blue-500">
														{exp.WorkPlace}
													</Typography>
													<Typography variant="caption" className="text-gray-400">
														{new Date(exp.DateFrom).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} -
														{exp.DateTo ? new Date(exp.DateTo).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Present'}
													</Typography>
												</div>
											))}
										</div>
									</Paper>

									{/* Education */}
									<Paper className="rounded-xl p-6" variant="outlined">
										<SectionTitle>
											<div className="flex items-center gap-2 text-blue-600">
												<FuseSvgIcon size={20}>lucide:graduation-cap</FuseSvgIcon> Educations
											</div>
										</SectionTitle>
										<div className="mt-4 space-y-6">
											{profile.Educations?.map((edu) => (
												<div key={edu.Id} className="relative pl-6">
													<div className="absolute left-0 top-1.5 h-2 w-2 rounded-full bg-green-500" />
													<Typography className="font-bold">{edu.FieldOfStudy}</Typography>
													<Typography variant="body2" className="text-gray-600">{edu.Institution}</Typography>
													<Typography variant="caption" className="text-gray-400">
														{new Date(edu.DateFrom).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
													</Typography>
												</div>
											))}
										</div>
									</Paper>
								</div>
							</div>
						</>
					)}
				</div>
			}
			scroll={isMobile ? 'page' : 'content'}
		/>
	);
}

export default ProfileDetailPageView;
