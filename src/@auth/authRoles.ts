/**
 * The authRoles object defines the authorization roles for the Fuse application.
 */
const authRoles = {
	/**
	 * The admin role grants access to users with the 'admin' role.
	 */
	admin: ['admin'],

	/**
	 * Any authenticated user in the app.
	 */
	authenticated: [
		'admin',
		'dataadmin',
		'recruiter',
		'candidate',
		'company',
		'client',
		'seller',
		'translator',
		'editor'
	],

	/**
	 * Account type roles.
	 */
	recruiter: ['admin', 'dataadmin', 'recruiter'],
	candidate: ['admin', 'dataadmin', 'candidate'],
	company: ['admin', 'dataadmin', 'company', 'client'],
	seller: ['admin', 'dataadmin', 'seller'],

	/**
	 * Backward-compatible alias.
	 */
	client: ['admin', 'dataadmin', 'company', 'client'],

	/**
	 * Content roles.
	 */
	translator: ['admin', 'dataadmin', 'translator'],
	editor: ['admin', 'dataadmin', 'editor'],
	dataadmin: ['admin', 'dataadmin'],

	/**
	 * The staff role grants access to users with the 'admin' or 'staff' role.
	 */
	staff: ['admin', 'staff'],

	/**
	 * The user role grants access to users with the 'admin', 'staff', or 'user' role.
	 */
	user: ['admin', 'staff', 'user'],

	/**
	 * The onlyGuest role grants access to unauthenticated users.
	 */
	onlyGuest: []
};

export default authRoles;
