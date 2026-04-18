'use client';

import { useEffect, useMemo, useState } from 'react';
import FusePageSimple from '@fuse/core/FusePageSimple';
import FuseLoading from '@fuse/core/FuseLoading';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { styled } from '@mui/material/styles';
import { Alert, Button, CircularProgress, InputBase, Paper, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import useUser from '@auth/useUser';
import useThemeMediaQuery from '@fuse/hooks/useThemeMediaQuery';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import { getProfilesList } from '@/api/services/profiles';

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

function MyProfilesPageView() {
	const { isReady } = useUser();
	const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down('lg'));
	const [searchText, setSearchText] = useState('');
	const [pageNumber, setPageNumber] = useState(0);
	const pageSize = 10;

	const payload = useMemo(
		() => ({
			PageSize: pageSize,
			PageNumber: pageNumber + 1,
			SearchText: searchText || undefined
		}),
		[pageNumber, searchText]
	);

	const { data, isLoading, error } = useQuery({
		queryKey: ['my-profiles', payload],
		queryFn: () => getProfilesList(payload),
		enabled: isReady
	});

	const items = useMemo(() => {
		if (!data) return [];

		if (Array.isArray(data)) return data;

		return ((data as Record<string, unknown>)?.Result as Record<string, unknown>[]) || [];
	}, [data]);
	const totalItems = (data as Record<string, unknown>)?.Paging
		? (((data as Record<string, unknown>).Paging as Record<string, unknown>)?.TotalItems as number) || 0
		: items.length;
	const totalPages = Math.ceil(totalItems / pageSize) || 1;

	useEffect(() => {
		setPageNumber(0);
	}, [searchText]);

	if (!isReady) {
		return <FuseLoading />;
	}

	return (
		<Root
			header={
				<div className="flex flex-col gap-4 p-6">
					<div className="flex flex-col gap-1">
						<Typography variant="h6">My Profiles</Typography>
						<PageBreadcrumb />
					</div>
					<Paper
						className="flex items-center rounded-full px-3 py-1"
						variant="outlined"
					>
						<FuseSvgIcon size={18}>lucide:search</FuseSvgIcon>
						<InputBase
							className="ml-2 flex-1"
							placeholder="Search..."
							value={searchText}
							onChange={(e) => setSearchText(e.target.value)}
						/>
					</Paper>
				</div>
			}
			content={
				<div className="p-6">
					{isLoading ? (
						<div className="flex items-center justify-center p-12">
							<CircularProgress />
						</div>
					) : error ? (
						<Alert severity="error">Failed to load data.</Alert>
					) : items.length === 0 ? (
						<div className="flex flex-col items-center gap-4 py-16">
							<FuseSvgIcon
								size={48}
								className="text-gray-400"
							>
								lucide:user
							</FuseSvgIcon>
							<Typography color="text.secondary">No items found.</Typography>
						</div>
					) : (
						<>
							<div className="flex flex-col divide-y rounded-xl border">
								{items.map((item: Record<string, unknown>, idx: number) => (
									<div
										key={(item.Pid as string | number) || idx}
										className="flex items-center justify-between p-4"
									>
										<div className="flex flex-col">
											<Typography className="font-medium">
												{(item.Title as string) || '—'}
											</Typography>
											{item.Description && (
												<Typography
													variant="body2"
													color="text.secondary"
												>
													{item.Description as string}
												</Typography>
											)}
										</div>
									</div>
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
				</div>
			}
			scroll={isMobile ? 'page' : 'content'}
		/>
	);
}

export default MyProfilesPageView;
