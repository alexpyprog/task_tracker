import { axiosInstance } from './client';
import { Group, GroupCreate, GroupUpdate, GroupMember } from '../types/group';

export const groupsApi = {
  // Получить все группы пользователя
  async getUserGroups(): Promise<Group[]> {
    const response = await axiosInstance.get<Group[]>('/groups/my-groups');
    return response.data;
  },

  // Получить группу по ID
  async getGroup(id: number): Promise<Group> {
    const response = await axiosInstance.get<Group>(`/groups/${id}`);
    return response.data;
  },

  // Создать группу
  async createGroup(data: GroupCreate): Promise<Group> {
    const response = await axiosInstance.post<Group>('/groups', data);
    return response.data;
  },

  // Обновить группу
  async updateGroup(id: number, data: GroupUpdate): Promise<Group> {
    const response = await axiosInstance.patch<Group>(`/groups/${id}`, data);
    return response.data;
  },

  // Удалить группу
  async deleteGroup(id: number): Promise<void> {
    await axiosInstance.delete(`/groups/${id}`);
  },

  // Получить участников группы
  async getGroupMembers(id: number, skip = 0, limit = 100): Promise<GroupMember[]> {
    const response = await axiosInstance.get<GroupMember[]>(`/groups/${id}/members`, {
      params: { skip, limit },
    });
    return response.data;
  },

  // Удалить участника из группы
  async removeMember(groupId: number, userId: number): Promise<void> {
    await axiosInstance.delete(`/groups/${groupId}/members/${userId}`);
  },

  // Выйти из группы
  async leaveGroup(groupId: number): Promise<void> {
    await axiosInstance.post(`/groups/${groupId}/leave`);
  },

  // Передать управление
  async transferManagement(groupId: number, newManagerId: number): Promise<Group> {
    const response = await axiosInstance.post<Group>(`/groups/${groupId}/transfer`, {
      new_manager_id: newManagerId,
    });
    return response.data;
  },
};