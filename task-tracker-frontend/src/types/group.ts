export interface Group {
  id: number;
  name: string;
  icon?: string;
  description?: string;
  manager_id: number;
  manager_name?: string;
  organization_id?: number | null;
  organization_name?: string;
  members_count?: number;
  tasks_count?: number;
  created_at: string;
  updated_at?: string;
}

export interface GroupCreate {
  name: string;
  description?: string;
  organization_id?: number | null;
}

export interface GroupUpdate {
  name?: string;
  description?: string;
  manager_id?: number;
}

export interface GroupMember {
  id: number;
  user_id: number;
  username: string;
  full_name: string;
  email: string;
  role: 'manager' | 'member';
  joined_at: string;
}