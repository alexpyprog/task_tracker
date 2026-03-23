import { axiosInstance } from './client';
import { UserOut, UserUpdate } from '../types/auth';

export const usersApi = {
  async getUserByUsername(username: string): Promise<UserOut> {
    const response = await axiosInstance.get<UserOut>(`/users/by-username/${username}`);
    return response.data;
  },

  async getCurrentUser(): Promise<UserOut> {
    const response = await axiosInstance.get<UserOut>('/users/me');
    return response.data;
  },

  async getUser(id: number): Promise<UserOut> {
    const response = await axiosInstance.get<UserOut>(`/users/${id}`);
    return response.data;
  },

  async updateUser(id: number, data: UserUpdate): Promise<UserOut> {
    const response = await axiosInstance.patch<UserOut>(`/users/${id}`, data);
    return response.data;
  },

  async deleteUser(id: number): Promise<{ result: boolean }> {
    const response = await axiosInstance.delete<{ result: boolean }>(`/users/${id}`);
    return response.data;
  },

  async searchUsers(query: string): Promise<UserOut[]> {
  // Временно используем getUserByUsername, но в идеале нужен отдельный эндпоинт
    try {
      const user = await this.getUserByUsername(query);
      return user ? [user] : [];
    } catch {
      return [];
    }
  },

  async getAllUsers(skip = 0, limit = 100): Promise<UserOut[]> {
    const response = await axiosInstance.get<UserOut[]>('/users/', {
      params: { skip, limit }
    });
    return response.data;
  },
  
};