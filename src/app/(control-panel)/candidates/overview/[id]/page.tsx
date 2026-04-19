'use client';
import { use } from 'react';
import OverviewDetailsPageView from './components/views/OverviewDetialsPageView';
type Props = {
    params: Promise<{ id: string }>;
};
export default function ProfileDetailPage({ params }: Props) {
    const unwrappedParams = use(params);
    return <OverviewDetailsPageView cid={unwrappedParams.id} />;
}
