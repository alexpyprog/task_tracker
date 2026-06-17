export interface UserLogin {
  username: string;
  password: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface UserCreate {
  username: string;
  full_name: string;
  email: string;
  phone: string;
  password: string;
  group_id?: number | null;
  organization_id?: number | null;
}

export interface UserUpdate {
  full_name?: string;
  email?: string;
  phone?: string;
  password?: string;
  user_status?: UserStatus;
  profile_photo_path?: string;
  group_id?: number | null;
  organization_id?: number | null;
}

export enum UserStatus {
  base_user = 'base_user',
  admin = 'admin',
  manager = 'manager',
  member = 'member'
}

export interface UserOut {
  id: number;
  username: string;
  full_name: string;
  email: string;
  phone: string;
  profile_photo_path: string | null;
  verified: boolean;
  user_status: UserStatus;
  organization_id: number | null;
  group_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface CurrentUser {
  id: number;
  user_status: UserStatus;
}