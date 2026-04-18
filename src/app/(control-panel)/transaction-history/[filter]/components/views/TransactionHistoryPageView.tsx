'use client';

import { useMemo } from 'react';
import FusePageSimple from '@fuse/core/FusePageSimple';
import FuseLoading from '@fuse/core/FuseLoading';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { styled } from '@mui/material/styles';
import { Alert, CircularProgress, Divider, Paper, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import useUser from '@auth/useUser';
import useThemeMediaQuery from '@fuse/hooks/useThemeMediaQuery';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import { getSellerTransactions } from '@/api/services/transactions';

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

function TransactionHistoryPageView() {
	const { isReady } = useUser();
	const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down('lg'));

	const { data, isLoading, isError } = useQuery({
		queryKey: ['transactions'],
		queryFn: getSellerTransactions,
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
						<FuseSvgIcon size={24}>lucide:receipt</FuseSvgIcon>
						<Typography variant="h6">Transaction History</Typography>
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

					{isError && <Alert severity="error">Failed to load transactions.</Alert>}

					{!isLoading && !isError && items.length === 0 && (
						<Alert severity="info">No transactions found.</Alert>
					)}

					{!isLoading && !isError && items.length > 0 && (
						<Paper className="flex flex-col">
							{items.map((transaction, index) => (
								<div key={transaction.id ?? index}>
									<div className="flex items-center justify-between p-16">
										<div className="flex flex-col gap-4">
											<Typography
												variant="body2"
												className="font-semibold"
											>
												{transaction.description || transaction.type}
											</Typography>
											<Typography
												variant="caption"
												color="text.secondary"
											>
												{transaction.date}
											</Typography>
										</div>
										<Typography
											variant="body2"
											className="font-semibold"
										>
											{transaction.currency} {transaction.amount}
										</Typography>
									</div>
									{index < items.length - 1 && <Divider />}
								</div>
							))}
						</Paper>
					)}
				</div>
			}
		/>
	);
}

export default TransactionHistoryPageView;
