'use client';

import { useState } from 'react';
import FusePageSimple from '@fuse/core/FusePageSimple';
import FuseLoading from '@fuse/core/FuseLoading';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { styled } from '@mui/material/styles';
import { Button, CircularProgress, Paper, Tab, Tabs, TextField, Typography } from '@mui/material';
import useUser from '@auth/useUser';
import useThemeMediaQuery from '@fuse/hooks/useThemeMediaQuery';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import { useSnackbar } from 'notistack';
import { assignRole, confirmEmail, deleteUserByEmail } from '@/api/services/admin';

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

function AdminPageView() {
	const { isReady } = useUser();
	const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down('lg'));
	const { enqueueSnackbar } = useSnackbar();

	const [tabIndex, setTabIndex] = useState(0);
	const [email, setEmail] = useState('');
	const [role, setRole] = useState('');
	const [loading, setLoading] = useState(false);

	const handleConfirmEmail = async () => {
		if (!email) return;

		setLoading(true);

		try {
			await confirmEmail(email);
			enqueueSnackbar('Email confirmed successfully', { variant: 'success' });
		} catch (_error) {
			enqueueSnackbar('Failed to confirm email', { variant: 'error' });
		} finally {
			setLoading(false);
		}
	};

	const handleDeleteUser = async () => {
		if (!email) return;

		setLoading(true);

		try {
			await deleteUserByEmail(email);
			enqueueSnackbar('User deleted successfully', { variant: 'success' });
			setEmail('');
		} catch (_error) {
			enqueueSnackbar('Failed to delete user', { variant: 'error' });
		} finally {
			setLoading(false);
		}
	};

	const handleAssignRole = async () => {
		if (!email || !role) return;

		setLoading(true);

		try {
			await assignRole(email, role);
			enqueueSnackbar('Role assigned successfully', { variant: 'success' });
			setRole('');
		} catch (_error) {
			enqueueSnackbar('Failed to assign role', { variant: 'error' });
		} finally {
			setLoading(false);
		}
	};

	if (!isReady) {
		return <FuseLoading />;
	}

	return (
		<Root
			scroll={isMobile ? 'page' : 'content'}
			header={
				<div className="flex w-full flex-col gap-4 p-24 sm:p-32">
					<div className="flex items-center gap-8">
						<FuseSvgIcon size={24}>lucide:shield</FuseSvgIcon>
						<Typography variant="h6">Admin Panel</Typography>
					</div>
					<PageBreadcrumb />
				</div>
			}
			content={
				<div className="flex w-full flex-col gap-24 p-24 sm:p-32">
					<Paper className="flex flex-col gap-24 p-24">
						<Tabs
							value={tabIndex}
							onChange={(_e, val) => setTabIndex(val)}
						>
							<Tab label="User Management" />
							<Tab label="Role Management" />
						</Tabs>

						<TextField
							label="Email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							fullWidth
							placeholder="Enter user email"
						/>

						{tabIndex === 0 && (
							<div className="flex items-center gap-16">
								<Button
									variant="contained"
									color="primary"
									onClick={handleConfirmEmail}
									disabled={loading || !email}
								>
									{loading ? <CircularProgress size={20} /> : 'Confirm Email'}
								</Button>
								<Button
									variant="contained"
									color="error"
									onClick={handleDeleteUser}
									disabled={loading || !email}
								>
									{loading ? <CircularProgress size={20} /> : 'Delete User'}
								</Button>
							</div>
						)}

						{tabIndex === 1 && (
							<div className="flex flex-col gap-16">
								<TextField
									label="Role"
									value={role}
									onChange={(e) => setRole(e.target.value)}
									fullWidth
									placeholder="Enter role name"
								/>
								<div>
									<Button
										variant="contained"
										color="primary"
										onClick={handleAssignRole}
										disabled={loading || !email || !role}
									>
										{loading ? <CircularProgress size={20} /> : 'Assign Role'}
									</Button>
								</div>
							</div>
						)}
					</Paper>
				</div>
			}
		/>
	);
}

export default AdminPageView;
