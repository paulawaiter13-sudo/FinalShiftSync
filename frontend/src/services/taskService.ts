import { apiRequest } from './api';
import type { Task, TaskPriority, TaskStatus } from '../types';

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  shiftId?: string;
}

function buildQuery(filters: TaskFilters): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v) params.set(k, v);
  });
  const q = params.toString();
  return q ? `?${q}` : '';
}

export function getTasks(filters: TaskFilters = {}): Promise<Task[]> {
  return apiRequest<Task[]>(`/tasks${buildQuery(filters)}`);
}

export function createTask(data: {
  title: string;
  description?: string;
  priority?: TaskPriority;
  assignedUserId?: string;
  shiftId?: string;
  dueDate?: string;
}): Promise<Task> {
  return apiRequest<Task>('/tasks', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateTask(
  id: string,
  data: Partial<{
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    assignedUserId: string | null;
    shiftId: string | null;
    dueDate: string | null;
  }>
): Promise<Task> {
  return apiRequest<Task>(`/tasks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function deleteTask(id: string): Promise<void> {
  return apiRequest<void>(`/tasks/${id}`, { method: 'DELETE' });
}
