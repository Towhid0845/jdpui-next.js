'use client';

import ProfileDetailPageView from './components/views/ProfileDetailPageView';

export default function ProfileDetailPage({ params }: { params: { id: string } }) {
	return <ProfileDetailPageView puid={params.id} />;
}
