"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type {
  Task,
  TaskListResponse,
  CreateTaskPayload,
  UpdateTaskPayload,
  TaskFilters,
} from "@/types";

export function useTasks(filters: TaskFilters) {
  return useQuery<TaskListResponse>({
    queryKey: ["tasks", filters],
    queryFn: () => api.get("/tasks", { params: filters }).then((r) => r.data),
  });
}

export function useTask(id: string) {
  return useQuery<Task>({
    queryKey: ["tasks", id],
    queryFn: () => api.get(`/tasks/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTaskPayload) =>
      api.post<Task>("/tasks", payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTaskPayload }) =>
      api.patch<Task>(`/tasks/${id}`, payload).then((r) => r.data),
    onMutate: async ({ id, payload }) => {
      await qc.cancelQueries({ queryKey: ["tasks"] });
      const snapshot = qc.getQueriesData<TaskListResponse>({ queryKey: ["tasks"] });
      qc.setQueriesData<TaskListResponse>({ queryKey: ["tasks"] }, (old) => {
        if (!old) return old;
        return {
          ...old,
          tasks: old.tasks.map((t) => (t.id === id ? { ...t, ...payload } : t)),
        };
      });
      return { snapshot };
    },
    onError: (_err, _vars, ctx) => {
      ctx?.snapshot.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/tasks/${id}`),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["tasks"] });
      const snapshot = qc.getQueriesData<TaskListResponse>({ queryKey: ["tasks"] });
      qc.setQueriesData<TaskListResponse>({ queryKey: ["tasks"] }, (old) => {
        if (!old) return old;
        return {
          ...old,
          tasks: old.tasks.filter((t) => t.id !== id),
          total: Math.max(0, old.total - 1),
        };
      });
      return { snapshot };
    },
    onError: (_err, _vars, ctx) => {
      ctx?.snapshot.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}
