'use client';
import { use } from 'react';
import ProfileDetailPageView from './components/views/ProfileDetailPageView';
type Props = {
	params: Promise<{ id: string }>;
};
export default function ProfileDetailPage({ params }: Props) {
	const unwrappedParams = use(params);
	return <ProfileDetailPageView puid={unwrappedParams.id} />;
}
