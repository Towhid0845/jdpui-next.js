import { useMemo } from 'react';
import { User } from '@auth/user';
import UserModel from '@auth/user/models/UserModel';
import _ from 'lodash';
import setIn from '@/utils/setIn';
import { useAuth } from './AuthProvider';

type useUser = {
	data: User | null;
	isGuest: boolean;
	isReady: boolean;
	updateUser: (updates: Partial<User>) => Promise<User | undefined>;
	updateUserSettings: (newSettings: User['settings']) => Promise<User['settings'] | undefined>;
	signOut: () => Promise<void>;
};

function useUser(): useUser {
	const { user, isGuest, isReady, updateUser, signOut } = useAuth();

	/**
	 * Update user
	 * Uses current auth provider's updateUser method
	 */
	async function handleUpdateUser(_data: Partial<User>) {
		const updatedUser = UserModel({ ...(user ?? {}), ..._data });
		updateUser(updatedUser);
		return updatedUser;
	}

	/**
	 * Update user settings
	 * Uses current auth provider's updateUser method
	 */
	async function handleUpdateUserSettings(newSettings: User['settings']) {
		const newUser = setIn(user, 'settings', newSettings) as User;

		if (_.isEqual(user, newUser)) {
			return undefined;
		}

		await handleUpdateUser(newUser);
		return newUser?.settings;
	}

	/**
	 * Sign out
	 */
	async function handleSignOut() {
		signOut();
	}

	return {
		data: user,
		isGuest,
		isReady,
		signOut: handleSignOut,
		updateUser: handleUpdateUser,
		updateUserSettings: handleUpdateUserSettings
	};
}

export default useUser;
