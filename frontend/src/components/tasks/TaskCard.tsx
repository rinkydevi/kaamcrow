"use client";
import { useState } from "react";
import { format } from "date-fns";
import type { Task, Attachment } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PRIORITY_COLOR, PRIORITY_LABEL, STATUS_COLOR, STATUS_LABEL } from "@/lib/utils";
import { useUpdateTask, useDeleteTask } from "@/hooks/useTasks";
import { useAttachments, useDeleteAttachment } from "@/hooks/useAttachments";
import { ActivityLog } from "./ActivityLog";

interface Props {
  task: Task;
  onEdit: (task: Task) => void;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function AttachmentRow({ att, taskId }: { att: Attachment; taskId: string }) {
  const deleteAtt = useDeleteAttachment();
  const isImage = att.mime_type.startsWith("image/");

  return (
    <div className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-xs dark:border-gray-700 dark:bg-gray-800/50">
      {isImage ? (
        <img
          src={`/api/uploads/${att.filename}`}
          alt={att.original_name}
          className="h-8 w-8 rounded object-cover"
        />
      ) : (
        <span className="text-lg">📎</span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-gray-700 dark:text-gray-300">{att.original_name}</p>
        <p className="text-gray-400">{formatBytes(att.size)}</p>
      </div>
      <a
        href={`/api/uploads/${att.filename}`}
        download={att.original_name}
        className="text-indigo-500 hover:underline"
      >
        ↓
      </a>
      <button
        onClick={() => deleteAtt.mutate({ taskId, attachmentId: att.id })}
        className="text-red-400 hover:text-red-600"
        disabled={deleteAtt.isPending}
      >
        ✕
      </button>
    </div>
  );
}

export function TaskCard({ task, onEdit }: Props) {
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const [expanded, setExpanded] = useState(false);
  const { data: attachments } = useAttachments(expanded ? task.id : null);

  const toggleDone = () =>
    updateTask.mutate({
      id: task.id,
      payload: { status: task.status === "done" ? "todo" : "done" },
    });

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <input
              type="checkbox"
              checked={task.status === "done"}
              onChange={toggleDone}
              className="mt-1 h-4 w-4 cursor-pointer rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <div className="min-w-0">
              <p
                className={`font-medium text-gray-900 dark:text-white truncate ${
                  task.status === "done" ? "line-through text-gray-400" : ""
                }`}
              >
                {task.title}
              </p>
              {task.description && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                  {task.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => onEdit(task)}>
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              loading={deleteTask.isPending}
              onClick={() => deleteTask.mutate(task.id)}
            >
              Delete
            </Button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge className={STATUS_COLOR[task.status]}>{STATUS_LABEL[task.status]}</Badge>
          <Badge className={PRIORITY_COLOR[task.priority]}>{PRIORITY_LABEL[task.priority]}</Badge>
          {task.due_date && (
            <span className="text-xs text-gray-500">
              Due {format(new Date(task.due_date), "MMM d, yyyy")}
            </span>
          )}
          <button
            onClick={() => setExpanded((v) => !v)}
            className="ml-auto text-xs text-indigo-500 hover:underline"
          >
            {expanded ? "Hide details ↑" : "Details ↓"}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3 dark:border-gray-700">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Attachments */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Attachments
              </p>
              {attachments && attachments.length > 0 ? (
                <div className="space-y-1">
                  {attachments.map((att) => (
                    <AttachmentRow key={att.id} att={att} taskId={task.id} />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400">No attachments.</p>
              )}
            </div>

            {/* Activity */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Activity
              </p>
              <ActivityLog taskId={task.id} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
