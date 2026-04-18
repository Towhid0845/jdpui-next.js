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
						<Typography variant="h6">{displayName || 'Profile Detail'}</Typography>
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
						<div className="mx-auto flex max-w-4xl flex-col gap-6">
							{/* Profile Header */}
							<Paper
								className="flex flex-col gap-4 rounded-xl p-6 md:flex-row md:items-start"
								variant="outlined"
							>
								<Avatar
									src={profile.ProfileImage || undefined}
									className="h-24 w-24 text-3xl"
								>
									{displayName[0]?.toUpperCase()}
								</Avatar>
								<div className="flex flex-1 flex-col gap-2">
									<div className="flex items-center gap-2">
										<Typography
											variant="h5"
											className="font-semibold"
										>
											{displayName}
										</Typography>
										{profile.IsVerified && (
											<FuseSvgIcon
												size={20}
												color="success"
											>
												lucide:badge-check
											</FuseSvgIcon>
										)}
									</div>
									{profile.Title && (
										<Typography
											variant="body1"
											color="text.secondary"
										>
											{profile.Title}
										</Typography>
									)}
									<div className="flex flex-wrap items-center gap-3">
										{profile.Country && (
											<div className="flex items-center gap-1">
												<FuseSvgIcon
													size={16}
													className="text-gray-500"
												>
													lucide:map-pin
												</FuseSvgIcon>
												<Typography variant="body2">{profile.Country}</Typography>
											</div>
										)}
										{profile.Rating !== undefined && profile.Rating > 0 && (
											<div className="flex items-center gap-1">
												<Rating
													value={profile.Rating}
													precision={0.5}
													size="small"
													readOnly
												/>
												{profile.RatingCount !== undefined && (
													<Typography
														variant="caption"
														color="text.secondary"
													>
														({profile.RatingCount})
													</Typography>
												)}
											</div>
										)}
										{profile.ExpectedSalaryText && (
											<Chip
												label={profile.ExpectedSalaryText}
												size="small"
												variant="outlined"
											/>
										)}
									</div>
									{profile.AvailableInText && (
										<Typography
											variant="body2"
											color="text.secondary"
										>
											Available in: {profile.AvailableInText}
										</Typography>
									)}
								</div>
							</Paper>

							{/* About */}
							{profile.AboutText1 && (
								<Paper
									className="rounded-xl p-6"
									variant="outlined"
								>
									<SectionTitle>About</SectionTitle>
									<div
										className="prose prose-sm max-w-none"
										dangerouslySetInnerHTML={{ __html: profile.AboutText1 }}
									/>
								</Paper>
							)}

							{/* Skills */}
							{profile.Skills && profile.Skills.length > 0 && (
								<Paper
									className="rounded-xl p-6"
									variant="outlined"
								>
									<SectionTitle>Skills</SectionTitle>
									<div className="flex flex-wrap gap-2">
										{profile.Skills.map((skill, i) => (
											<Chip
												key={i}
												label={skill}
												variant="outlined"
											/>
										))}
									</div>
								</Paper>
							)}

							{/* Professional Experience */}
							{profile.ProfessionalExperiences && profile.ProfessionalExperiences.length > 0 && (
								<Paper
									className="rounded-xl p-6"
									variant="outlined"
								>
									<SectionTitle>Professional Experience</SectionTitle>
									<div className="flex flex-col gap-4">
										{profile.ProfessionalExperiences.map((exp, i) => (
											<div key={i}>
												{i > 0 && <Divider className="mb-4" />}
												<Typography className="font-medium">
													{((exp as Record<string, unknown>).Title as string) || 'Position'}
												</Typography>
												{(exp as Record<string, unknown>).CompanyName && (
													<Typography
														variant="body2"
														color="text.secondary"
													>
														{(exp as Record<string, unknown>).CompanyName as string}
													</Typography>
												)}
												{(exp as Record<string, unknown>).Description && (
													<Typography
														variant="body2"
														className="mt-1"
													>
														{(exp as Record<string, unknown>).Description as string}
													</Typography>
												)}
											</div>
										))}
									</div>
								</Paper>
							)}

							{/* Education */}
							{profile.Educations && profile.Educations.length > 0 && (
								<Paper
									className="rounded-xl p-6"
									variant="outlined"
								>
									<SectionTitle>Education</SectionTitle>
									<div className="flex flex-col gap-4">
										{profile.Educations.map((edu, i) => (
											<div key={i}>
												{i > 0 && <Divider className="mb-4" />}
												<Typography className="font-medium">
													{((edu as Record<string, unknown>).DegreeName as string) ||
														((edu as Record<string, unknown>).DegreeType as string) ||
														'Degree'}
												</Typography>
												{(edu as Record<string, unknown>).InstituteName && (
													<Typography
														variant="body2"
														color="text.secondary"
													>
														{(edu as Record<string, unknown>).InstituteName as string}
													</Typography>
												)}
											</div>
										))}
									</div>
								</Paper>
							)}

							{/* Languages */}
							{profile.Languages && profile.Languages.length > 0 && (
								<Paper
									className="rounded-xl p-6"
									variant="outlined"
								>
									<SectionTitle>Languages</SectionTitle>
									<div className="flex flex-wrap gap-2">
										{profile.Languages.map((lang, i) => (
											<Chip
												key={i}
												label={
													((lang as Record<string, unknown>).Name as string) ||
													((lang as Record<string, unknown>).LanguageName as string) ||
													'Language'
												}
												variant="outlined"
											/>
										))}
									</div>
								</Paper>
							)}

							{/* Certificates */}
							{profile.Certificates && profile.Certificates.length > 0 && (
								<Paper
									className="rounded-xl p-6"
									variant="outlined"
								>
									<SectionTitle>Certificates</SectionTitle>
									<div className="flex flex-col gap-4">
										{profile.Certificates.map((cert, i) => (
											<div key={i}>
												{i > 0 && <Divider className="mb-4" />}
												<Typography className="font-medium">
													{((cert as Record<string, unknown>).Name as string) ||
														((cert as Record<string, unknown>).Title as string) ||
														'Certificate'}
												</Typography>
												{(cert as Record<string, unknown>).Issuer && (
													<Typography
														variant="body2"
														color="text.secondary"
													>
														{(cert as Record<string, unknown>).Issuer as string}
													</Typography>
												)}
											</div>
										))}
									</div>
								</Paper>
							)}
						</div>
					)}
				</div>
			}
			scroll={isMobile ? 'page' : 'content'}
		/>
	);
}

export default ProfileDetailPageView;
