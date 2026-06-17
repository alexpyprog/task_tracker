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

  async getTasksByGroup(groupId: number, skip = 0, limit = 100): Promise<TaskListOut[]> {
    // Если бэкенд поддерживает фильтрацию по group_id
    const params = new URLSearchParams();
    params.append('skip', skip.toString());
    params.append('limit', limit.toString());
    params.append('group_id', groupId.toString());
    
    const response = await axiosInstance.get<TaskListOut[]>(`/tasks/by-group?${params}`);
    return response.data;
  },

  async getAllGroupTasks(groupId: number): Promise<TaskListOut[]> {
    // Временно используем существующие методы
    const [myTasks, createdByMe] = await Promise.all([
      this.getMyTasks(0, 500),
      this.getCreatedByMe(0, 500),
    ]);
    
    // Объединяем и фильтруем
    const allTasksMap = new Map<string, TaskListOut>();
    [...myTasks, ...createdByMe].forEach(task => {
      if (!allTasksMap.has(task.id)) {
        allTasksMap.set(task.id, task);
      }
    });
    
    return Array.from(allTasksMap.values()).filter(
      task => task.group_id === groupId
    );
  },
};