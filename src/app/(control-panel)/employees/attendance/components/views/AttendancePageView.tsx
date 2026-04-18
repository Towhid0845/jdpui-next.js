'use client';

import { useMemo, useState } from 'react';
import FusePageSimple from '@fuse/core/FusePageSimple';
import FuseLoading from '@fuse/core/FuseLoading';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { styled } from '@mui/material/styles';
import { Alert, CircularProgress, Divider, Paper, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import useUser from '@auth/useUser';
import useThemeMediaQuery from '@fuse/hooks/useThemeMediaQuery';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import { getAttendances } from '@/api/services/employees';

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

function AttendancePageView() {
	const { isReady } = useUser();
	const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down('lg'));

	const now = new Date();
	const [month, setMonth] = useState(now.getMonth() + 1);
	const [year, setYear] = useState(now.getFullYear());

	const { data, isLoading, isError } = useQuery({
		queryKey: ['attendance', month, year],
		queryFn: () => getAttendances({ Month: month, Year: year }),
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
						<FuseSvgIcon size={24}>lucide:calendar-check</FuseSvgIcon>
						<Typography variant="h6">Attendance</Typography>
					</div>
					<PageBreadcrumb />
				</div>
			}
			content={
				<div className="flex w-full flex-col gap-16 p-24 sm:p-32">
					<div className="flex items-center gap-16">
						<div className="flex items-center gap-8">
							<Typography
								variant="body2"
								color="text.secondary"
							>
								Month:
							</Typography>
							<select
								value={month}
								onChange={(e) => setMonth(Number(e.target.value))}
								className="rounded border px-8 py-4"
							>
								{Array.from({ length: 12 }, (_, i) => (
									<option
										key={i + 1}
										value={i + 1}
									>
										{i + 1}
									</option>
								))}
							</select>
						</div>
						<div className="flex items-center gap-8">
							<Typography
								variant="body2"
								color="text.secondary"
							>
								Year:
							</Typography>
							<select
								value={year}
								onChange={(e) => setYear(Number(e.target.value))}
								className="rounded border px-8 py-4"
							>
								{Array.from({ length: 5 }, (_, i) => {
									const y = now.getFullYear() - 2 + i;
									return (
										<option
											key={y}
											value={y}
										>
											{y}
										</option>
									);
								})}
							</select>
						</div>
					</div>

					{isLoading && (
						<div className="flex justify-center p-24">
							<CircularProgress />
						</div>
					)}

					{isError && <Alert severity="error">Failed to load attendance records.</Alert>}

					{!isLoading && !isError && items.length === 0 && (
						<Alert severity="info">No attendance records found.</Alert>
					)}

					{!isLoading && !isError && items.length > 0 && (
						<Paper className="flex flex-col">
							{items.map((record, index) => (
								<div key={record.id ?? index}>
									<div className="flex items-center justify-between p-16">
										<Typography
											variant="body2"
											className="min-w-[120px] font-semibold"
										>
											{record.date}
										</Typography>
										<Typography
											variant="body2"
											color="text.secondary"
										>
											{record.inTime} - {record.outTime}
										</Typography>
										<Typography
											variant="body2"
											color="text.secondary"
										>
											{record.status}
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

export default AttendancePageView;
