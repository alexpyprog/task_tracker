export enum TaskStatus {
  cancelled = 'cancelled',
  created = 'created',
  in_progress = 'in_progress',
  completed = 'completed'
}

export interface TaskBase {
  title: string;
  description?: string | null;
  deadline?: string | null;
  worker_id: number;
  status: TaskStatus;
}

export interface TaskCreate extends TaskBase {}

export interface TaskUpdate {
  title?: string;
  description?: string | null;
  deadline?: string | null;
  worker_id?: number;
  status?: TaskStatus;
  updated_by?: number;
}

export interface TaskOut {
  id: string;
  title: string;
  description: string | null;
  deadline: string | null;
  worker_id: number;
  status: TaskStatus;
  created_by: number;
  created_at: string;
  updated_by: number | null;
  updated_at: string | null;
}

export interface TaskListOut {
  id: string;
  title: string;
  status: TaskStatus;
  deadline: string | null;
  created_at: string;
  worker_id: number;
  created_by: number;
}

export interface TaskFilter {
  status?: TaskStatus;
  worker_id?: number;
  created_by?: number;
}