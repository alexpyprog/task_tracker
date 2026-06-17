import { axiosInstance } from './client';
import { Invitation, InvitationCreate, InvitationStatus } from '../types/invitation';

export const invitationsApi = {
  // Отправить приглашение
  async sendInvitation(groupId: number, data: InvitationCreate): Promise<Invitation> {
    const response = await axiosInstance.post<Invitation>(`/invitations`, data);
    return response.data;
  },

  // Получить входящие приглашения
  async getIncomingInvitations(): Promise<Invitation[]> {
    const response = await axiosInstance.get<Invitation[]>('/invitations/incoming');
    return response.data;
  },

  // Получить исходящие приглашения
  async getOutgoingInvitations(): Promise<Invitation[]> {
    const response = await axiosInstance.get<Invitation[]>('/invitations/outgoing');
    return response.data;
  },

  // Принять приглашение
  async acceptInvitation(invitationId: string): Promise<void> {
    await axiosInstance.post(`/invitations/${invitationId}/accept`);
  },

  // Отклонить приглашение
  async declineInvitation(invitationId: string): Promise<void> {
    await axiosInstance.post(`/invitations/${invitationId}/decline`);
  },

  // Отменить приглашение (только для отправителя)
  async cancelInvitation(invitationId: string): Promise<void> {
    await axiosInstance.delete(`/invitations/${invitationId}`);
  },
};