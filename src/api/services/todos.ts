import { apiClient } from '../jdpClient';

export type TodoItem = {
	Id?: number;
	Title?: string;
	Notes?: string;
	Completed?: boolean;
	Starred?: boolean;
	Important?: boolean;
	StartDate?: string;
	DueDate?: string;
	Tags?: string[];
	[key: string]: unknown;
};

export type TodoListResponse = {
	Result?: TodoItem[];
	Paging?: {
		TotalItems?: number;
		PageNumber?: number;
		PageSize?: number;
	};
	[key: string]: unknown;
};

export async function getTodos(payload: Record<string, unknown>): Promise<TodoListResponse> {
	return apiClient.post('api/Todo/Todos', { json: payload }).json<TodoListResponse>();
}

export async function addTodo(payload: Record<string, unknown>): Promise<unknown> {
	return apiClient.post('api/Todo', { json: payload }).json<unknown>();
}

export async function updateTodo(payload: Record<string, unknown>): Promise<unknown> {
	return apiClient.put('api/Todo', { json: payload }).json<unknown>();
}

export async function deleteTodo(id: number): Promise<unknown> {
	return apiClient.delete(`api/Todo/${id}`).json<unknown>();
}

export async function getTopTasks(count = 5): Promise<TodoItem[]> {
	return apiClient.get(`api/Todo/GetTopTasks/${count}`).json<TodoItem[]>();
}
