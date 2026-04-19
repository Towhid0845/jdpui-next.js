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
				title: 'ONLINE PROFILES',
				translate: 'nav-candidate-search-title',
				type: 'item',
				icon: 'lucide:search',
				url: '/candidates/profiles'
			},
			{
				id: 'job-market',
				title: 'JOB MARKET',
				translate: 'job-market-upper',
				type: 'item',
				icon: 'lucide:briefcase',
				url: '/job-market'
			},
			{
				id: 'profile-leads',
				title: 'LEADS',
				translate: 'profile-leads-upper',
				type: 'item',
				icon: 'lucide:target',
				url: '/profile-leads',
				disabled: true
			},
			{
				id: 'overview',
				title: 'MY CANDIDATES',
				translate: 'nav-candidate-overview-title',
				type: 'item',
				icon: 'lucide:users',
				url: '/candidates/overview'
			},
			{
				id: 'vacancy_manager',
				title: 'VACANCY MANAGER',
				translate: 'vacancy-manager-upper',
				type: 'item',
				icon: 'lucide:clipboard-list',
				url: '/vacancy-manager'
			},
			{
				id: 'clients',
				title: 'CLIENTS & CONTACTS',
				translate: 'clients-upper',
				type: 'item',
				icon: 'lucide:contact',
				url: '/clients'
			},
			{
				id: 'sellers',
				title: 'SERVICES',
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
				title: 'MY PROFILES',
				translate: 'my-profiles-title',
				type: 'item',
				icon: 'lucide:user',
				url: '/my-profiles'
			},
			{
				id: 'my_proposal',
				title: 'MY PROPOSALS',
				translate: 'my-proposal-title',
				type: 'item',
				icon: 'lucide:inbox',
				url: '/my-proposals'
			},
			{
				id: 'online_vacancy',
				title: 'LIVE JOBS',
				translate: 'live-jobs-upper',
				type: 'item',
				icon: 'lucide:radio',
				url: '/online-vacancies'
			},
			{
				id: 'candidate_office',
				title: 'MY OFFICE',
				type: 'collapsable',
				icon: 'lucide:building',
				children: [
					{
						id: 'client_attendance',
						title: 'ATTENDANCE',
						translate: 'nav-employee-attendance',
						type: 'item',
						icon: 'lucide:calendar-check',
						url: '/employees/attendance'
					},
					{
						id: 'notice_board_client',
						title: 'NOTICE BOARD',
						translate: 'nav-employee-notice',
						type: 'item',
						icon: 'lucide:clipboard',
						url: '/employees/notice_board'
					}
				]
			},
			{
				id: 'seller_services',
				title: 'MY SERVICES',
				translate: 'seller-services-title',
				type: 'item',
				icon: 'lucide:briefcase-business',
				url: '/services'
			},
			{
				id: 'seller_orders',
				title: 'MY ORDERS',
				translate: 'seller-orders-title',
				type: 'item',
				icon: 'lucide:shopping-bag',
				url: '/orders'
			},
			{
				id: 'seller_notifications',
				title: 'NOTIFICATIONS',
				translate: 'seller-notifications-title',
				type: 'item',
				icon: 'lucide:bell',
				url: '/services/notifications'
			},
			{
				id: 'todo',
				title: 'TODO',
				translate: 'todo-upper',
				type: 'item',
				icon: 'lucide:check-square',
				url: '/todos'
			},
			{
				id: 'calendar',
				title: 'CALENDAR',
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
				title: 'RECRUITER PROPOSALS',
				translate: 'applicant-proposal-title',
				type: 'item',
				icon: 'lucide:folder-kanban',
				url: '/client-proposals'
			},
			{
				id: 'dashboard',
				title: 'DASHBOARD',
				translate: 'dashboard-upper',
				type: 'item',
				icon: 'lucide:gauge',
				url: '/dashboard'
			},
			{
				id: 'client_candidates',
				title: 'MY CANDIDATES',
				translate: 'nav-candidate-overview-title',
				type: 'item',
				icon: 'lucide:users',
				url: '/candidates/overview'
			},
			{
				id: 'vacancy_manager_client',
				title: 'VACANCY MANAGER',
				translate: 'vacancy-manager-upper',
				type: 'item',
				icon: 'lucide:clipboard-list',
				url: '/vacancy-manager'
			},
			{
				id: 'clients_client',
				title: 'CLIENTS & CONTACTS',
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
				title: 'MY SERVICES',
				translate: 'seller-services-title',
				type: 'item',
				icon: 'lucide:briefcase-business',
				url: '/services'
			},
			{
				id: 'seller_orders_only',
				title: 'MY ORDERS',
				translate: 'seller-orders-title',
				type: 'item',
				icon: 'lucide:shopping-bag',
				url: '/orders'
			},
			{
				id: 'seller_notifications_only',
				title: 'NOTIFICATIONS',
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
				title: 'ONLINE PROFILES',
				translate: 'nav-candidate-search-title',
				type: 'item',
				icon: 'lucide:search',
				url: '/candidates/profiles'
			},
			{
				id: 'online_vacancy_world',
				title: 'LIVE JOBS',
				translate: 'live-jobs-upper',
				type: 'item',
				icon: 'lucide:radio',
				url: '/online-vacancies'
			},
			{
				id: 'sellers_world',
				title: 'SERVICES',
				translate: 'services-upper',
				type: 'item',
				icon: 'lucide:shop',
				url: '/sellers'
			},
			{
				id: 'profile_purchases',
				title: 'PURCHASES',
				translate: 'purchases-upper',
				type: 'item',
				icon: 'lucide:wallet',
				url: '/candidates/orders'
			},
			{
				id: 'transaction_history',
				title: 'TRANSACTION HISTORY',
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
				title: 'RESOURCES',
				translate: 'nav-learning-resources-title',
				type: 'item',
				icon: 'lucide:library',
				url: '/learning-resources'
			}
		]
	}
];

export default navigationConfig;
