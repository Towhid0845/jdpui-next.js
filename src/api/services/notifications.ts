import { apiClient } from '../jdpClient';

export type NotificationItem = Record<string, unknown>;

export const getNotifications = async (page = 1): Promise<NotificationItem[]> => {
	return apiClient.get(`api/Notification/GetAllNotification/${page}`).json<NotificationItem[]>();
};

export const deleteNotification = async (payload: NotificationItem): Promise<unknown> => {
	return apiClient.post('api/Notification/DeleteNotification', { json: payload }).json<unknown>();
};

export const markReadNotifications = async (): Promise<unknown> => {
	return apiClient.get('api/Notification/MarkReadNotifications').json<unknown>();
};

export const deleteAllNotifications = async (): Promise<unknown> => {
	return apiClient.delete('api/Notification/DeleteAllNotifications').json<unknown>();
};
