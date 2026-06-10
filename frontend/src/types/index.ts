export type Role = "user" | "admin";
export type Status = "todo" | "in_progress" | "done";
export type Priority = "low" | "medium" | "high";
export type SortField = "due_date" | "priority" | "created_at" | "title";
export type SortDir = "asc" | "desc";
export type ActivityAction = "created" | "updated" | "deleted";

export interface User {
  id: string;
  email: string;
  role: Role;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskListResponse {
  tasks: Task[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  status?: Status;
  priority?: Priority;
  due_date?: string | null;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  status?: Status;
  priority?: Priority;
  due_date?: string | null;
}

export interface TaskFilters {
  status?: Status | "";
  search?: string;
  sort_by?: SortField;
  sort_dir?: SortDir;
  page?: number;
  limit?: number;
}

export interface Attachment {
  id: string;
  task_id: string;
  user_id: string;
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  task_id: string;
  user_id: string;
  action: ActivityAction;
  old_values?: Record<string, unknown> | null;
  new_values?: Record<string, unknown> | null;
  created_at: string;
}
