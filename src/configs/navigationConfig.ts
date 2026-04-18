import { FuseNavItemType } from '@fuse/core/FuseNavigation/types/FuseNavItemType';

/**
 * The navigationConfig object is an array of navigation items for the Fuse application.
 */
const navigationConfig: FuseNavItemType[] = [
	{
		id: 'applications',
		title: 'hide',
		translate: 'applications',
		type: 'group',
		auth: ['recruiter'],
		children: [
			{
				id: 'candidate_search',
				title: 'Online Profiles',
				translate: 'nav-candidate-search-title',
				type: 'item',
				icon: 'lucide:search',
				url: '/candidates/profiles'
			},
			{
				id: 'job-market',
				title: 'Job Market',
				translate: 'job-market-text',
				type: 'item',
				icon: 'lucide:briefcase',
				url: '/job-market'
			},
			{
				id: 'profile-leads',
				title: 'Leads',
				translate: 'profile-leads-upper',
				type: 'item',
				icon: 'lucide:target',
				url: '/profile-leads',
				disabled: true
			},
			{
				id: 'overview',
				title: 'My Candidates',
				translate: 'nav-candidate-overview-title',
				type: 'item',
				icon: 'lucide:users',
				url: '/candidates/overview'
			},
			{
				id: 'vacancy_manager',
				title: 'Vacancy Manager',
				translate: 'vacancy-manager-upper',
				type: 'item',
				icon: 'lucide:clipboard-list',
				url: '/vacancy-manager'
			},
			{
				id: 'clients',
				title: 'Clients & Contacts',
				translate: 'clients-upper',
				type: 'item',
				icon: 'lucide:contact',
				url: '/clients'
			},
			{
				id: 'sellers',
				title: 'Services',
				translate: 'services-upper',
				type: 'item',
				icon: 'lucide:shop',
				url: '/sellers',
				disabled: true
			}
		]
	},
	{
		id: 'candidate-nav',
		title: 'hide',
		translate: 'market-place-w-upper',
		type: 'group',
		auth: ['candidate'],
		children: [
			{
				id: 'my_profiles',
				title: 'My Profiles',
				translate: 'my-profiles-title',
				type: 'item',
				icon: 'lucide:user',
				url: '/my-profiles'
			},
			{
				id: 'my_proposal',
				title: 'My Proposals',
				translate: 'my-proposal-title',
				type: 'item',
				icon: 'lucide:inbox',
				url: '/my-proposals'
			},
			{
				id: 'online_vacancy',
				title: 'Live Jobs',
				translate: 'live-jobs-upper',
				type: 'item',
				icon: 'lucide:radio',
				url: '/online-vacancies'
			},
			{
				id: 'candidate_office',
				title: 'My Office',
				type: 'collapsable',
				icon: 'lucide:building',
				children: [
					{
						id: 'client_attendance',
						title: 'Attendance',
						translate: 'nav-employee-attendance',
						type: 'item',
						icon: 'lucide:calendar-check',
						url: '/employees/attendance'
					},
					{
						id: 'notice_board_client',
						title: 'Notice Board',
						translate: 'nav-employee-notice',
						type: 'item',
						icon: 'lucide:clipboard',
						url: '/employees/notice_board'
					}
				]
			},
			{
				id: 'seller_services',
				title: 'My Services',
				translate: 'seller-services-title',
				type: 'item',
				icon: 'lucide:briefcase-business',
				url: '/services'
			},
			{
				id: 'seller_orders',
				title: 'My Orders',
				translate: 'seller-orders-title',
				type: 'item',
				icon: 'lucide:shopping-bag',
				url: '/orders'
			},
			{
				id: 'seller_notifications',
				title: 'Notifications',
				translate: 'seller-notifications-title',
				type: 'item',
				icon: 'lucide:bell',
				url: '/services/notifications'
			},
			{
				id: 'todo',
				title: 'Todo',
				translate: 'todo-upper',
				type: 'item',
				icon: 'lucide:check-square',
				url: '/todos'
			},
			{
				id: 'calendar',
				title: 'Calendar',
				translate: 'calendar-upper',
				type: 'item',
				icon: 'lucide:calendar',
				url: '/calendar'
			}
		]
	},
	{
		id: 'client-nav',
		title: 'hide',
		translate: 'market-place-w-upper',
		type: 'group',
		auth: ['company', 'client'],
		children: [
			{
				id: 'client_proposals',
				title: 'Recruiter Proposals',
				translate: 'applicant-proposal-title',
				type: 'item',
				icon: 'lucide:folder-kanban',
				url: '/client-proposals'
			},
			{
				id: 'dashboard',
				title: 'Dashboard',
				translate: 'dashboard-upper',
				type: 'item',
				icon: 'lucide:gauge',
				url: '/dashboard'
			},
			{
				id: 'client_candidates',
				title: 'My Candidates',
				translate: 'nav-candidate-overview-title',
				type: 'item',
				icon: 'lucide:users',
				url: '/candidates/overview'
			},
			{
				id: 'vacancy_manager_client',
				title: 'Vacancy Manager',
				translate: 'vacancy-manager-upper',
				type: 'item',
				icon: 'lucide:clipboard-list',
				url: '/vacancy-manager'
			},
			{
				id: 'clients_client',
				title: 'Clients & Contacts',
				translate: 'clients-upper',
				type: 'item',
				icon: 'lucide:contact',
				url: '/clients'
			}
		]
	},
	{
		id: 'sellers-nav',
		title: 'hide',
		translate: 'market-place-w-upper',
		type: 'group',
		auth: ['seller'],
		children: [
			{
				id: 'seller_services_only',
				title: 'My Services',
				translate: 'seller-services-title',
				type: 'item',
				icon: 'lucide:briefcase-business',
				url: '/services'
			},
			{
				id: 'seller_orders_only',
				title: 'My Orders',
				translate: 'seller-orders-title',
				type: 'item',
				icon: 'lucide:shopping-bag',
				url: '/orders'
			},
			{
				id: 'seller_notifications_only',
				title: 'Notifications',
				translate: 'seller-notifications-title',
				type: 'item',
				icon: 'lucide:bell',
				url: '/services/notifications'
			}
		]
	},
	{
		id: 'marketplace_world_client',
		title: 'MARKET PLACE (WORLD)',
		translate: 'market-place-w-upper',
		type: 'group',
		auth: ['company', 'client'],
		children: [
			{
				id: 'candidate_search_world',
				title: 'Online Profiles',
				translate: 'nav-candidate-search-title',
				type: 'item',
				icon: 'lucide:search',
				url: '/candidates/profiles'
			},
			{
				id: 'online_vacancy_world',
				title: 'Live Jobs',
				translate: 'live-jobs-upper',
				type: 'item',
				icon: 'lucide:radio',
				url: '/online-vacancies'
			},
			{
				id: 'sellers_world',
				title: 'Services',
				translate: 'services-upper',
				type: 'item',
				icon: 'lucide:shop',
				url: '/sellers'
			},
			{
				id: 'profile_purchases',
				title: 'Purchases',
				translate: 'purchases-upper',
				type: 'item',
				icon: 'lucide:wallet',
				url: '/candidates/orders'
			},
			{
				id: 'transaction_history',
				title: 'Transaction History',
				translate: 'transaction-history-upper',
				type: 'item',
				icon: 'lucide:receipt',
				url: '/transaction-history/0'
			}
		]
	},
	{
		id: 'learning_center',
		title: 'Learning Center',
		translate: 'learning-center-nav-upper',
		type: 'group',
		auth: ['candidate'],
		children: [
			{
				id: 'learning_resources',
				title: 'Resources',
				translate: 'nav-learning-resources-title',
				type: 'item',
				icon: 'lucide:library',
				url: '/learning-resources'
			}
		]
	}
];

export default navigationConfig;
