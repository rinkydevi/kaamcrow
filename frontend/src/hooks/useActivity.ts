import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import type { ActivityLog } from "@/types";

export function useActivity(taskId: string | null) {
  return useQuery<ActivityLog[]>({
    queryKey: ["activity", taskId],
    queryFn: () => api.get(`/tasks/${taskId}/activity`).then((r) => r.data),
    enabled: !!taskId,
  });
}
