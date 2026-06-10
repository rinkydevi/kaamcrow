"use client";
import { useState } from "react";
import { format } from "date-fns";
import type { Task, Attachment } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  PRIORITY_COLOR,
  PRIORITY_LABEL,
  STATUS_COLOR,
  STATUS_LABEL,
  STATUS_DOT,
  PRIORITY_DOT,
} from "@/lib/utils";
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

/* Feather SVG icon for the expand toggle */
function FeatherIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/>
      <line x1="16" y1="8" x2="2" y2="22"/>
      <line x1="17.5" y1="15" x2="9" y2="15"/>
    </svg>
  );
}

function AttachmentRow({ att, taskId }: { att: Attachment; taskId: string }) {
  const deleteAtt = useDeleteAttachment();
  const isImage = att.mime_type.startsWith("image/");

  return (
    <div className="flex items-center gap-2 rounded-lg border border-crow-border/60 bg-crow-shadow/60 px-3 py-2 text-xs">
      {isImage ? (
        <img
          src={`/api/uploads/${att.filename}`}
          alt={att.original_name}
          className="h-8 w-8 rounded object-cover border border-crow-border/40"
        />
      ) : (
        <span className="flex h-8 w-8 items-center justify-center rounded bg-crow-feather/10 text-crow-feather text-base">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-crow-text">{att.original_name}</p>
        <p className="text-crow-muted">{formatBytes(att.size)}</p>
      </div>
      <a
        href={`/api/uploads/${att.filename}`}
        download={att.original_name}
        className="text-crow-shimmer hover:text-crow-wing transition-colors"
        title="Download"
      >
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      </a>
      <button
        onClick={() => deleteAtt.mutate({ taskId, attachmentId: att.id })}
        className="text-crow-muted hover:text-red-400 transition-colors"
        disabled={deleteAtt.isPending}
        title="Remove attachment"
        aria-label="Remove attachment"
      >
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
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

  const priorityClass =
    task.priority === "high"
      ? "priority-high"
      : task.priority === "medium"
      ? "priority-medium"
      : "priority-low";

  return (
    <div className={`glass-card rounded-xl transition-all duration-300 ${priorityClass}`}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          {/* Checkbox + content */}
          <div className="flex items-start gap-3 min-w-0">
            <input
              type="checkbox"
              checked={task.status === "done"}
              onChange={toggleDone}
              className="crow-checkbox mt-0.5"
              aria-label={`Mark "${task.title}" as ${task.status === "done" ? "incomplete" : "complete"}`}
            />
            <div className="min-w-0">
              <p
                className={`font-medium truncate transition-all duration-200 ${
                  task.status === "done"
                    ? "line-through text-crow-muted"
                    : "text-crow-text"
                }`}
              >
                {task.title}
              </p>
              {task.description && (
                <p className="mt-1 text-sm text-crow-muted line-clamp-2">
                  {task.description}
                </p>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex shrink-0 items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(task)}
              className="text-xs px-2.5 py-1.5"
            >
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs px-2.5 py-1.5 text-red-400 hover:bg-red-500/10 hover:text-red-300"
              loading={deleteTask.isPending}
              onClick={() => deleteTask.mutate(task.id)}
            >
              Delete
            </Button>
          </div>
        </div>

        {/* Meta row */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {/* Status badge with dot */}
          <Badge className={STATUS_COLOR[task.status]}>
            <span className={`status-dot ${STATUS_DOT[task.status]}`} />
            {STATUS_LABEL[task.status]}
          </Badge>

          {/* Priority badge */}
          <Badge className={PRIORITY_COLOR[task.priority]}>
            {PRIORITY_LABEL[task.priority]}
          </Badge>

          {task.due_date && (
            <span className="text-xs text-crow-muted flex items-center gap-1">
              <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              {format(new Date(task.due_date), "MMM d, yyyy")}
            </span>
          )}

          {/* Expand toggle */}
          <button
            onClick={() => setExpanded((v) => !v)}
            className="ml-auto flex items-center gap-1.5 text-xs text-crow-muted hover:text-crow-feather transition-colors duration-200"
            aria-expanded={expanded}
            aria-label={expanded ? "Hide task details" : "Show task details"}
          >
            <FeatherIcon className={`h-3.5 w-3.5 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`} />
            {expanded ? "Hide" : "Details"}
          </button>
        </div>
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div className="border-t border-crow-border/40 px-4 pb-4 pt-3">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Attachments */}
            <div>
              <p className="mb-2.5 text-xs font-semibold uppercase tracking-widest text-crow-muted/70">
                Attachments
              </p>
              {attachments && attachments.length > 0 ? (
                <div className="space-y-1.5">
                  {attachments.map((att) => (
                    <AttachmentRow key={att.id} att={att} taskId={task.id} />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-crow-muted/60 italic">No attachments.</p>
              )}
            </div>

            {/* Activity */}
            <div>
              <p className="mb-2.5 text-xs font-semibold uppercase tracking-widest text-crow-muted/70">
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
