import { axiosInstance } from './client';
import { UserOut, UserUpdate } from '../types/auth';

export const usersApi = {
  async searchUsers(
    query: string = '', 
    groupId?: number | null,
    skip: number = 0, 
    limit: number = 20
  ): Promise<UserOut[]> {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (groupId) params.append('group_id', groupId.toString());
    params.append('skip', skip.toString());
    params.append('limit', limit.toString());
    
    const response = await axiosInstance.get<UserOut[]>(`/users/search?${params}`);
    return response.data;
  },

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

  async getAllUsers(): Promise<UserOut[]> {
    const response = await axiosInstance.get<UserOut[]>('/users/all');
    return response.data;
  },
  
};