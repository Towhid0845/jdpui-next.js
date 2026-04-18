'use client';

import { useEffect, useMemo, useState } from 'react';
import FusePageSimple from '@fuse/core/FusePageSimple';
import FuseLoading from '@fuse/core/FuseLoading';
import useThemeMediaQuery from '@fuse/hooks/useThemeMediaQuery';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { styled } from '@mui/material/styles';
import { Alert, Box, CircularProgress, Tab, Tabs, Typography } from '@mui/material';
import useUser from '@auth/useUser';
import { useSystemData } from '@/contexts/SystemDataContext';
import PersonalSettingsTab from './PersonalSettingsTab';
import AccountSettingsTab from './AccountSettingsTab';
import UsersSettingsTab from './UsersSettingsTab';

const Root = styled(FusePageSimple)(({ theme }) => ({
	'& .FusePageSimple-header': {
		backgroundColor: theme.vars.palette.background.paper,
		borderBottomWidth: 1,
		borderStyle: 'solid',
		borderColor: theme.vars.palette.divider
	},
	'& .FusePageSimple-contentWrapper': {
		paddingTop: 2,
		paddingLeft: 2
	},
	'& .FusePageSimple-content': {
		boxShadow: theme.vars.shadows[2],
		borderRadius: '12px',
		backgroundColor: theme.vars.palette.background.paper
	}
}));

function SettingsPageView() {
	const { data: user, isReady } = useUser();
	const { typeInfos, supportedCultures, isReady: systemReady, isLoading: systemLoading, error: systemError } =
		useSystemData();
	const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down('lg'));
	const [activeTab, setActiveTab] = useState(0);

	const countries = useMemo(() => typeInfos['System.Country'] || [], [typeInfos]);
	const currencies = useMemo(() => typeInfos['System.Currency'] || [], [typeInfos]);
	const userTypes = useMemo(() => typeInfos['System.Usertype'] || [], [typeInfos]);
	const phoneCodes = useMemo(() => typeInfos['System.PhoneCode'] || [], [typeInfos]);
	const loading = systemLoading || !systemReady;
	const loadError = systemError;

	const showUsersTab = useMemo(() => {
		const profile = (user?.profile || {}) as any;
		const userType = profile?.UserType;
		const accountType = profile?.AccountType ?? user?.accountType;
		return (userType === null || userType === undefined || Number(userType) < 1) && Number(accountType) !== 2;
	}, [user]);

	const tabs = useMemo(() => {
		const items = [
			{ key: 'personal', label: 'Personal settings', icon: 'lucide:user' },
			{ key: 'account', label: 'Account settings', icon: 'lucide:settings' }
		];

		if (showUsersTab) {
			items.push({ key: 'users', label: 'Users', icon: 'lucide:users' });
		}

		return items;
	}, [showUsersTab]);

	useEffect(() => {
		if (activeTab >= tabs.length) {
			setActiveTab(0);
		}
	}, [activeTab, tabs.length]);

	if (!isReady) {
		return <FuseLoading />;
	}

	return (
		<Root
			header={
				<div className="flex flex-col gap-4 p-6">
					<Typography variant="h6">Settings</Typography>
					<Tabs
						value={activeTab}
						onChange={(_, value) => setActiveTab(value)}
						variant={isMobile ? 'scrollable' : 'standard'}
						scrollButtons={isMobile ? 'auto' : false}
						allowScrollButtonsMobile
					>
						{tabs.map((tab) => (
							<Tab
								key={tab.key}
								label={tab.label}
								icon={<FuseSvgIcon>{tab.icon}</FuseSvgIcon>}
								iconPosition="start"
							/>
						))}
					</Tabs>
				</div>
			}
			content={
				<div className="p-6">
					{loading ? (
						<div className="flex items-center justify-center p-12">
							<CircularProgress />
						</div>
					) : loadError ? (
						<Alert severity="error">{loadError}</Alert>
					) : !user ? (
						<Alert severity="warning">No user session found.</Alert>
					) : (
						<Box className="flex flex-col gap-6">
							{tabs[activeTab]?.key === 'personal' && (
								<PersonalSettingsTab
									user={user}
									countries={countries}
									currencies={currencies}
									phoneCodes={phoneCodes}
									supportedCultures={supportedCultures}
								/>
							)}
							{tabs[activeTab]?.key === 'account' && (
								<AccountSettingsTab
									user={user}
									countries={countries}
								/>
							)}
							{tabs[activeTab]?.key === 'users' && (
								<UsersSettingsTab
									user={user}
									userTypes={userTypes}
								/>
							)}
						</Box>
					)}
				</div>
			}
			scroll={isMobile ? 'page' : 'content'}
		/>
	);
}

export default SettingsPageView;

