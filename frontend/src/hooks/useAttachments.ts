import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { Attachment } from "@/types";

export function useAttachments(taskId: string | null) {
  return useQuery<Attachment[]>({
    queryKey: ["attachments", taskId],
    queryFn: () => api.get(`/tasks/${taskId}/attachments`).then((r) => r.data),
    enabled: !!taskId,
  });
}

export function useUploadAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, file }: { taskId: string; file: File }) => {
      const form = new FormData();
      form.append("file", file);
      return api
        .post<Attachment>(`/tasks/${taskId}/attachments`, form, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        .then((r) => r.data);
    },
    onSuccess: (_, { taskId }) =>
      qc.invalidateQueries({ queryKey: ["attachments", taskId] }),
  });
}

export function useDeleteAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, attachmentId }: { taskId: string; attachmentId: string }) =>
      api.delete(`/tasks/${taskId}/attachments/${attachmentId}`),
    onSuccess: (_, { taskId }) =>
      qc.invalidateQueries({ queryKey: ["attachments", taskId] }),
  });
}
