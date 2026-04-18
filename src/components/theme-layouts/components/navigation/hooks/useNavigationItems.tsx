import { useMemo } from 'react';
import useUser from '@auth/useUser';
import FuseUtils from '@fuse/utils';
import FuseNavigationHelper from '@fuse/utils/FuseNavigationHelper';
import { FuseNavItemType } from '@fuse/core/FuseNavigation/types/FuseNavItemType';
import { useSystemData } from '@/contexts/SystemDataContext';
import { useNavigationContext } from '../contexts/useNavigationContext';

function useNavigationItems() {
	const { navigationItems: navigationData } = useNavigationContext();

	const { data: user } = useUser();
	const userRole = user?.role;
	const { getLabel } = useSystemData();

	const data = useMemo(() => {
		const _navigation = FuseNavigationHelper.unflattenNavigation(navigationData);

		function resolveTitle(item: FuseNavItemType) {
			if (!item?.translate) {
				return item?.title;
			}
			const fallback = item.title && item.title !== 'hide' ? item.title : '';
			return getLabel(item.translate, fallback);
		}

		function setAdditionalData(data: FuseNavItemType[]): FuseNavItemType[] {
			return data?.map((item) => ({
				hasPermission: Boolean(FuseUtils.hasPermission(item?.auth, userRole)),
				...item,
				...(item?.translate ? { title: resolveTitle(item) } : {}),
				...(item?.children ? { children: setAdditionalData(item?.children) } : {})
			}));
		}

		const translatedValues = setAdditionalData(_navigation);

		return translatedValues;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [navigationData, userRole, getLabel]);

	const flattenData = useMemo(() => {
		return FuseNavigationHelper.flattenNavigation(data);
	}, [data]);

	return { data, flattenData };
}

export default useNavigationItems;
