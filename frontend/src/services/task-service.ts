import apiClientWithRetry from './api-client';
import { ApiResponse } from '../types/api';
import { Task } from '../types/task';

// Backend returns either a raw Task[] array or { data: Task[] }. Unwrap so we always return Task[].
function unwrapTasks(raw: unknown): Task[] {
  if (Array.isArray(raw)) return raw as Task[];
  if (raw && typeof raw === 'object' && 'data' in raw) {
    const d = (raw as ApiResponse<Task[]>).data;
    return Array.isArray(d) ? d : [];
  }
  return [];
}

export const getTasks = async (): Promise<Task[]> => {
  const raw = await apiClientWithRetry.get<Task[] | ApiResponse<Task[]>>(`/signup/users/from-token/tasks`);
  return unwrapTasks(raw);
};

export const createTask = async (taskData: { title: string; description?: string; completed?: boolean }) => {
  const raw = await apiClientWithRetry.post<Task | ApiResponse<Task>>(
    `/signup/users/from-token/tasks`,
    taskData
  );
  const task = (raw && typeof raw === 'object' && 'data' in raw) ? (raw as unknown as ApiResponse<Task>).data : raw;
  if (!task || typeof task !== 'object') throw new Error('Task creation failed: no data returned');
  return task as Task;
};

export const updateTask = async (taskId: number, taskData: { title?: string; description?: string; completed?: boolean }) => {
  const raw = await apiClientWithRetry.put<Task | ApiResponse<Task>>(
    `/signup/users/from-token/tasks/${taskId}`,
    taskData
  );
  const task = (raw && typeof raw === 'object' && 'data' in raw) ? (raw as unknown as ApiResponse<Task>).data : raw;
  if (!task || typeof task !== 'object') throw new Error('Task update failed: no data returned');
  return task as Task;
};

export const deleteTask = async (taskId: number) => {
  await apiClientWithRetry.delete(`/signup/users/from-token/tasks/${taskId}`);
  return true;
};

export const toggleTaskCompletion = async (taskId: number, completed: boolean) => {
  const raw = await apiClientWithRetry.patch<Task | ApiResponse<Task>>(
    `/signup/users/from-token/tasks/${taskId}/complete`,
    { completed }
  );
  const task = (raw && typeof raw === 'object' && 'data' in raw) ? (raw as unknown as ApiResponse<Task>).data : raw;
  if (!task || typeof task !== 'object') throw new Error('Task completion toggle failed: no data returned');
  return task as Task;
};
