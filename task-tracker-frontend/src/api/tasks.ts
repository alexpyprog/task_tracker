import { axiosInstance } from './client';
import { TaskCreate, TaskUpdate, TaskOut, TaskListOut } from '../types/task';

export const tasksApi = {
  async getMyTasks(skip = 0, limit = 100, status?: string): Promise<TaskListOut[]> {
    const params = new URLSearchParams();
    params.append('skip', skip.toString());
    params.append('limit', limit.toString());
    if (status) params.append('task_status', status);
    
    const response = await axiosInstance.get<TaskListOut[]>(`/tasks/my-tasks?${params}`);
    return response.data;
  },

  async getCreatedByMe(skip = 0, limit = 100, status?: string): Promise<TaskListOut[]> {
    const params = new URLSearchParams();
    params.append('skip', skip.toString());
    params.append('limit', limit.toString());
    if (status) params.append('task_status', status);
    
    const response = await axiosInstance.get<TaskListOut[]>(`/tasks/created-by-me?${params}`);
    return response.data;
  },

  async getTask(id: string): Promise<TaskOut> {
    const response = await axiosInstance.get<TaskOut>(`/tasks/${id}`);
    return response.data;
  },

  async createTask(data: TaskCreate): Promise<TaskOut> {
    const response = await axiosInstance.post<TaskOut>('/tasks/', data);
    return response.data;
  },

  async updateTask(id: string, data: TaskUpdate): Promise<TaskOut> {
    const response = await axiosInstance.put<TaskOut>(`/tasks/${id}`, data);
    return response.data;
  },

  async deleteTask(id: string): Promise<void> {
    await axiosInstance.delete(`/tasks/${id}`);
  },
};