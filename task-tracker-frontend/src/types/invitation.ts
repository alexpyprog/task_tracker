export enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  EXPIRED = 'expired',
}

export interface Invitation {
  id: string;
  from_user: number;
  from_user_name?: string;
  to_user: number;
  to_user_name?: string;
  group_id: number;
  group_name?: string;
  status: InvitationStatus;
  created_at: string;
  expires_at?: string;
}

export interface InvitationCreate {
  group_id?: number;
  to_user_id?: number;
  email?: string;
  message?: string;
}