"use client";
import { format } from "date-fns";
import { useActivity } from "@/hooks/useActivity";
import type { ActivityAction } from "@/types";

const LABEL: Record<ActivityAction, string> = {
  created: "Created",
  updated: "Updated",
  deleted: "Deleted",
};

const COLOR: Record<ActivityAction, string> = {
  created: "bg-teal-500/15 text-teal-300 border border-teal-500/20",
  updated: "bg-blue-500/15 text-blue-300 border border-blue-500/20",
  deleted: "bg-red-500/15 text-red-400 border border-red-500/20",
};

export function ActivityLog({ taskId }: { taskId: string }) {
  const { data, isLoading } = useActivity(taskId);

  if (isLoading) {
    return <p className="text-xs text-crow-muted/60 italic py-2">Loading…</p>;
  }

  if (!data?.length) {
    return <p className="text-xs text-crow-muted/60 italic py-2">No activity recorded yet.</p>;
  }

  return (
    <ul className="mt-2 space-y-2">
      {data.map((log) => (
        <li key={log.id} className="flex items-center gap-2 text-xs">
          <span className={`shrink-0 rounded-full px-2 py-0.5 font-medium ${COLOR[log.action]}`}>
            {LABEL[log.action]}
          </span>
          <span className="text-crow-muted">
            {format(new Date(log.created_at), "MMM d, yyyy 'at' h:mm a")}
          </span>
        </li>
      ))}
    </ul>
  );
}
