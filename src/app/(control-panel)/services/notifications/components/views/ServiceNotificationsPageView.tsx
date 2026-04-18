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
import { getNotifications } from '@/api/services/notifications';

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

function ServiceNotificationsPageView() {
	const { isReady } = useUser();
	const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down('lg'));

	const { data, isLoading, isError } = useQuery({
		queryKey: ['service-notifications'],
		queryFn: () => getNotifications(1),
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
						<FuseSvgIcon size={24}>lucide:bell</FuseSvgIcon>
						<Typography variant="h6">Notifications</Typography>
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

					{isError && <Alert severity="error">Failed to load notifications.</Alert>}

					{!isLoading && !isError && items.length === 0 && (
						<Alert severity="info">No notifications found.</Alert>
					)}

					{!isLoading &&
						!isError &&
						items.map((notification, index) => (
							<Paper
								key={notification.id ?? index}
								className="flex flex-col gap-8 p-16"
							>
								<Typography variant="body1">{notification.message || notification.title}</Typography>
							</Paper>
						))}
				</div>
			}
		/>
	);
}

export default ServiceNotificationsPageView;
