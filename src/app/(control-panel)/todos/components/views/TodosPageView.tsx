'use client';

import { useCallback, useMemo, useState } from 'react';
import FusePageSimple from '@fuse/core/FusePageSimple';
import FuseLoading from '@fuse/core/FuseLoading';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { styled } from '@mui/material/styles';
import {
	Alert,
	Button,
	Checkbox,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	IconButton,
	TextField,
	Typography
} from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import useUser from '@auth/useUser';
import useThemeMediaQuery from '@fuse/hooks/useThemeMediaQuery';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import { getTodos, addTodo, updateTodo, deleteTodo, TodoItem } from '@/api/services/todos';

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

function TodosPageView() {
	const { isReady } = useUser();
	const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down('lg'));
	const { enqueueSnackbar } = useSnackbar();
	const queryClient = useQueryClient();
	const [addOpen, setAddOpen] = useState(false);
	const [newTitle, setNewTitle] = useState('');
	const [adding, setAdding] = useState(false);

	const { data, isLoading, error } = useQuery({
		queryKey: ['todos'],
		queryFn: () => getTodos({ PageSize: 50, PageNumber: 1, Rid: 50439 }),
		enabled: isReady
	});

	const items = useMemo(() => {
		if (!data) return [];

		if (Array.isArray(data)) return data as TodoItem[];

		return (data.Result as TodoItem[]) || [];
	}, [data]);

	const invalidate = useCallback(() => {
		queryClient.invalidateQueries({ queryKey: ['todos'] });
	}, [queryClient]);

	const handleAdd = async () => {
		if (!newTitle.trim()) return;

		setAdding(true);
		try {
			await addTodo({ Title: newTitle.trim() });
			setNewTitle('');
			setAddOpen(false);
			invalidate();
			enqueueSnackbar('Todo added.', { variant: 'success' });
		} catch {
			enqueueSnackbar('Failed to add todo.', { variant: 'error' });
		} finally {
			setAdding(false);
		}
	};

	const handleToggle = async (todo: TodoItem) => {
		try {
			await updateTodo({ ...todo, Completed: !todo.Completed });
			invalidate();
		} catch {
			enqueueSnackbar('Failed to update.', { variant: 'error' });
		}
	};

	const handleDelete = async (todo: TodoItem) => {
		if (!todo.Id) return;

		try {
			await deleteTodo(todo.Id);
			invalidate();
			enqueueSnackbar('Todo deleted.', { variant: 'success' });
		} catch {
			enqueueSnackbar('Failed to delete.', { variant: 'error' });
		}
	};

	if (!isReady) {
		return <FuseLoading />;
	}

	return (
		<Root
			header={
				<div className="flex items-center justify-between p-6">
					<div className="flex flex-col gap-1">
						<Typography variant="h6">Todo</Typography>
						<PageBreadcrumb />
					</div>
					<Button
						variant="contained"
						startIcon={<FuseSvgIcon>lucide:plus</FuseSvgIcon>}
						onClick={() => setAddOpen(true)}
					>
						Add Todo
					</Button>
				</div>
			}
			content={
				<div className="p-6">
					{isLoading ? (
						<div className="flex items-center justify-center p-12">
							<CircularProgress />
						</div>
					) : error ? (
						<Alert severity="error">Failed to load todos.</Alert>
					) : items.length === 0 ? (
						<div className="flex flex-col items-center gap-4 py-16">
							<FuseSvgIcon
								size={48}
								className="text-gray-400"
							>
								lucide:check-square
							</FuseSvgIcon>
							<Typography color="text.secondary">No todos yet.</Typography>
						</div>
					) : (
						<div className="flex flex-col divide-y rounded-xl border">
							{items.map((todo, idx) => (
								<div
									key={todo.Id || idx}
									className="flex items-center gap-3 p-3"
								>
									<Checkbox
										checked={!!todo.Completed}
										onChange={() => handleToggle(todo)}
									/>
									<Typography className={`flex-1 ${todo.Completed ? 'line-through opacity-50' : ''}`}>
										{todo.Title}
									</Typography>
									<IconButton
										size="small"
										onClick={() => handleDelete(todo)}
									>
										<FuseSvgIcon
											size={18}
											className="text-gray-400"
										>
											lucide:trash
										</FuseSvgIcon>
									</IconButton>
								</div>
							))}
						</div>
					)}

					<Dialog
						open={addOpen}
						onClose={() => setAddOpen(false)}
						maxWidth="xs"
						fullWidth
					>
						<DialogTitle>Add Todo</DialogTitle>
						<DialogContent dividers>
							<TextField
								label="Title"
								value={newTitle}
								onChange={(e) => setNewTitle(e.target.value)}
								fullWidth
								autoFocus
							/>
						</DialogContent>
						<DialogActions>
							<Button onClick={() => setAddOpen(false)}>Cancel</Button>
							<Button
								variant="contained"
								onClick={handleAdd}
								disabled={adding || !newTitle.trim()}
							>
								{adding ? <CircularProgress size={18} /> : 'Add'}
							</Button>
						</DialogActions>
					</Dialog>
				</div>
			}
			scroll={isMobile ? 'page' : 'content'}
		/>
	);
}

export default TodosPageView;
