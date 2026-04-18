import { apiClient } from '../jdpClient';

export type TransactionItem = {
	Id?: number;
	Type?: string;
	Amount?: number;
	Currency?: string;
	Description?: string;
	Date?: string;
	Status?: string;
	[key: string]: unknown;
};

export async function getSellerTransactions(): Promise<TransactionItem[]> {
	return apiClient.get('api/Seller/GetSellerTransactions').json<TransactionItem[]>();
}
