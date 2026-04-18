'use client';

import { useMemo } from 'react';
import FusePageSimple from '@fuse/core/FusePageSimple';
import FuseLoading from '@fuse/core/FuseLoading';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { styled } from '@mui/material/styles';
import { Alert, CircularProgress, Paper, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import useUser from '@auth/useUser';
import useThemeMediaQuery from '@fuse/hooks/useThemeMediaQuery';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import { getNotices } from '@/api/services/employees';

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

function NoticeBoardPageView() {
	const { isReady } = useUser();
	const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down('lg'));

	const { data, isLoading, isError } = useQuery({
		queryKey: ['notices'],
		queryFn: () => getNotices(1, 20),
		enabled: isReady
	});

	const items = useMemo(() => (Array.isArray(data) ? data : []), [data]);

	if (!isReady) {
		return <FuseLoading />;
	}

	return (
		<Root
			scroll={isMobile ? 'page' : 'content'}
			header={
				<div className="flex w-full flex-col gap-4 p-24 sm:p-32">
					<div className="flex items-center gap-8">
						<FuseSvgIcon size={24}>lucide:clipboard</FuseSvgIcon>
						<Typography variant="h6">Notice Board</Typography>
					</div>
					<PageBreadcrumb />
				</div>
			}
			content={
				<div className="flex w-full flex-col gap-16 p-24 sm:p-32">
					{isLoading && (
						<div className="flex justify-center p-24">
							<CircularProgress />
						</div>
					)}

					{isError && <Alert severity="error">Failed to load notices.</Alert>}

					{!isLoading && !isError && items.length === 0 && <Alert severity="info">No notices found.</Alert>}

					{!isLoading &&
						!isError &&
						items.map((notice, index) => (
							<Paper
								key={notice.id ?? index}
								className="flex flex-col gap-8 p-16"
							>
								<Typography
									variant="subtitle1"
									className="font-semibold"
								>
									{notice.title}
								</Typography>
								<Typography
									variant="body2"
									color="text.secondary"
								>
									{notice.description}
								</Typography>
							</Paper>
						))}
				</div>
			}
		/>
	);
}

export default NoticeBoardPageView;
