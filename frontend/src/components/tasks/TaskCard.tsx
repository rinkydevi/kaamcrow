"use client";
import { useState } from "react";
import { format } from "date-fns";
import type { Task, Attachment } from "@/types";
import { useUpdateTask, useDeleteTask } from "@/hooks/useTasks";
import { useAttachments, useDeleteAttachment } from "@/hooks/useAttachments";
import { ActivityLog } from "./ActivityLog";

interface Props {
  task: Task;
  onEdit: (task: Task) => void;
}

const PRIORITY_LABEL: Record<string, string> = { low: "Low", medium: "Med", high: "High" };
const PRIORITY_DOT: Record<string, string>   = { low: "#22c55e", medium: "#f59e0b", high: "#ef4444" };

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
      fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function AttachmentRow({ att, taskId }: { att: Attachment; taskId: string }) {
  const deleteAtt = useDeleteAttachment();
  const isImage = att.mime_type.startsWith("image/");

  return (
    <div className="flex items-center gap-2 rounded-lg border border-crow-border bg-crow-shadow/40 px-3 py-2 text-xs">
      {isImage ? (
        <img src={`/api/uploads/${att.filename}`} alt={att.original_name}
          className="h-7 w-7 rounded object-cover border border-crow-border" />
      ) : (
        <span className="flex h-7 w-7 items-center justify-center rounded bg-crow-shadow text-crow-muted text-[10px] font-medium">
          FILE
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-crow-text">{att.original_name}</p>
        <p className="text-crow-muted">{formatBytes(att.size)}</p>
      </div>
      <a href={`/api/uploads/${att.filename}`} download={att.original_name}
        className="text-crow-muted hover:text-crow-text transition-colors" title="Download">
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      </a>
      <button onClick={() => deleteAtt.mutate({ taskId, attachmentId: att.id })}
        disabled={deleteAtt.isPending}
        className="text-crow-muted hover:text-red-500 transition-colors"
        aria-label="Remove attachment">
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

  const isDone = task.status === "done";

  const toggleDone = () =>
    updateTask.mutate({
      id: task.id,
      payload: { status: isDone ? "todo" : "done" },
    });

  const priorityBorderClass =
    task.priority === "high" ? "priority-high"
    : task.priority === "medium" ? "priority-medium"
    : "priority-low";

  return (
    <div className={`task-card ${priorityBorderClass}`}>
      <div className="px-4 py-3.5">
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <input
            type="checkbox"
            checked={isDone}
            onChange={toggleDone}
            className="crow-checkbox mt-0.5"
            aria-label={`Mark "${task.title}" as ${isDone ? "incomplete" : "complete"}`}
          />

          {/* Content */}
          <div className="min-w-0 flex-1">
            <p className={`text-sm font-medium leading-snug ${
              isDone ? "line-through text-crow-muted" : "text-crow-text"
            }`}>
              {task.title}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-crow-muted">
              {isDone && <span>Completed · </span>}
              <span>Created {format(new Date(task.created_at ?? Date.now()), "M/d/yyyy")}</span>
              {task.due_date && (
                <span className="text-crow-muted">
                  · Due {format(new Date(task.due_date), "MMM d")}
                </span>
              )}
              {/* Priority dot + label */}
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full inline-block" style={{ background: PRIORITY_DOT[task.priority] }} />
                {PRIORITY_LABEL[task.priority]}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-1">
            <button
              onClick={() => onEdit(task)}
              className="rounded-md px-2.5 py-1.5 text-xs text-crow-muted hover:text-crow-text hover:bg-crow-shadow transition-all duration-150"
            >
              Edit
            </button>
            <button
              disabled={deleteTask.isPending}
              onClick={() => deleteTask.mutate(task.id)}
              className="rounded-md px-2.5 py-1.5 text-xs text-crow-muted hover:text-red-500 hover:bg-red-500/8 transition-all duration-150"
            >
              Delete
            </button>
            <button
              onClick={() => setExpanded(v => !v)}
              className="rounded-md p-1.5 text-crow-muted hover:text-crow-text hover:bg-crow-shadow transition-all duration-150"
              aria-expanded={expanded}
              aria-label={expanded ? "Hide details" : "Show details"}
            >
              <ChevronIcon open={expanded} />
            </button>
          </div>
        </div>
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div className="border-t border-crow-border px-4 pb-4 pt-3">
          {task.description && (
            <p className="mb-3 text-xs text-crow-muted leading-relaxed">{task.description}</p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-crow-muted">
                Attachments
              </p>
              {attachments && attachments.length > 0 ? (
                <div className="space-y-1.5">
                  {attachments.map(att => (
                    <AttachmentRow key={att.id} att={att} taskId={task.id} />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-crow-muted italic">No attachments.</p>
              )}
            </div>
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-crow-muted">
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
