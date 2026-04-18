'use client';

import { useCallback, useMemo, useState } from 'react';
import FusePageSimple from '@fuse/core/FusePageSimple';
import FuseLoading from '@fuse/core/FuseLoading';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { styled } from '@mui/material/styles';
import {
	Alert,
	Button,
	Chip,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	IconButton,
	Paper,
	TextField,
	Typography
} from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import useUser from '@auth/useUser';
import useThemeMediaQuery from '@fuse/hooks/useThemeMediaQuery';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import { CalendarEvent, getAllEvents, addEvent, deleteEvent } from '@/api/services/calendar';
import { format } from 'date-fns';

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

function CalendarPageView() {
	const { isReady } = useUser();
	const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down('lg'));
	const queryClient = useQueryClient();
	const { enqueueSnackbar } = useSnackbar();

	const [dialogOpen, setDialogOpen] = useState(false);
	const [title, setTitle] = useState('');
	const [start, setStart] = useState('');
	const [end, setEnd] = useState('');
	const [submitting, setSubmitting] = useState(false);

	const { data, isLoading, isError } = useQuery<CalendarEvent[]>({
		queryKey: ['calendar-events'],
		queryFn: getAllEvents,
		enabled: isReady
	});

	const items = useMemo(() => (Array.isArray(data) ? data : []), [data]);

	const handleAdd = useCallback(async () => {
		if (!title || !start) return;

		setSubmitting(true);

		try {
			await addEvent({ title, start, end: end || start });
			queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
			enqueueSnackbar('Event added successfully', { variant: 'success' });
			setDialogOpen(false);
			setTitle('');
			setStart('');
			setEnd('');
		} catch (_error) {
			enqueueSnackbar('Failed to add event', { variant: 'error' });
		} finally {
			setSubmitting(false);
		}
	}, [title, start, end, queryClient, enqueueSnackbar]);

	const handleDelete = useCallback(
		async (id: string) => {
			try {
				await deleteEvent(id);
				queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
				enqueueSnackbar('Event deleted successfully', { variant: 'success' });
			} catch (_error) {
				enqueueSnackbar('Failed to delete event', { variant: 'error' });
			}
		},
		[queryClient, enqueueSnackbar]
	);

	if (!isReady) {
		return <FuseLoading />;
	}

	return (
		<Root
			scroll={isMobile ? 'page' : 'content'}
			header={
				<div className="flex w-full flex-col gap-4 p-24 sm:p-32">
					<div className="flex items-center justify-between gap-8">
						<div className="flex items-center gap-8">
							<FuseSvgIcon size={24}>lucide:calendar</FuseSvgIcon>
							<Typography variant="h6">Calendar</Typography>
						</div>
						<Button
							variant="contained"
							color="primary"
							startIcon={<FuseSvgIcon size={16}>lucide:plus</FuseSvgIcon>}
							onClick={() => setDialogOpen(true)}
						>
							Add Event
						</Button>
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

					{isError && <Alert severity="error">Failed to load calendar events.</Alert>}

					{!isLoading && !isError && items.length === 0 && <Alert severity="info">No events found.</Alert>}

					{!isLoading &&
						!isError &&
						items.map((event) => (
							<Paper
								key={event.id}
								className="flex items-center justify-between gap-8 p-16"
							>
								<div className="flex flex-col gap-4">
									<Typography
										variant="subtitle1"
										className="font-semibold"
									>
										{event.title}
									</Typography>
									<Typography
										variant="body2"
										color="text.secondary"
									>
										{event.start ? format(new Date(event.start), 'MMM d, yyyy') : 'No date'}
									</Typography>
								</div>
								<div className="flex items-center gap-8">
									{event.allDay && (
										<Chip
											label="All Day"
											size="small"
											color="primary"
										/>
									)}
									<IconButton
										color="error"
										onClick={() => handleDelete(event.id)}
										size="small"
									>
										<FuseSvgIcon size={18}>lucide:trash-2</FuseSvgIcon>
									</IconButton>
								</div>
							</Paper>
						))}

					<Dialog
						open={dialogOpen}
						onClose={() => setDialogOpen(false)}
						maxWidth="sm"
						fullWidth
					>
						<DialogTitle>Add Event</DialogTitle>
						<DialogContent className="flex flex-col gap-16 pt-8">
							<TextField
								label="Title"
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								fullWidth
								margin="dense"
							/>
							<TextField
								label="Start"
								type="datetime-local"
								value={start}
								onChange={(e) => setStart(e.target.value)}
								fullWidth
								margin="dense"
								slotProps={{ inputLabel: { shrink: true } }}
							/>
							<TextField
								label="End"
								type="datetime-local"
								value={end}
								onChange={(e) => setEnd(e.target.value)}
								fullWidth
								margin="dense"
								slotProps={{ inputLabel: { shrink: true } }}
							/>
						</DialogContent>
						<DialogActions>
							<Button onClick={() => setDialogOpen(false)}>Cancel</Button>
							<Button
								onClick={handleAdd}
								variant="contained"
								disabled={submitting || !title || !start}
							>
								{submitting ? <CircularProgress size={20} /> : 'Add'}
							</Button>
						</DialogActions>
					</Dialog>
				</div>
			}
		/>
	);
}

export default CalendarPageView;
