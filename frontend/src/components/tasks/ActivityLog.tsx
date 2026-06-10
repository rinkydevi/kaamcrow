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
  created: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  updated: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  deleted: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export function ActivityLog({ taskId }: { taskId: string }) {
  const { data, isLoading } = useActivity(taskId);

  if (isLoading) {
    return <p className="text-xs text-gray-400 py-2">Loading…</p>;
  }

  if (!data?.length) {
    return <p className="text-xs text-gray-400 py-2">No activity recorded yet.</p>;
  }

  return (
    <ul className="mt-2 space-y-2">
      {data.map((log) => (
        <li key={log.id} className="flex items-center gap-2 text-xs">
          <span className={`shrink-0 rounded-full px-2 py-0.5 font-medium ${COLOR[log.action]}`}>
            {LABEL[log.action]}
          </span>
          <span className="text-gray-500 dark:text-gray-400">
            {format(new Date(log.created_at), "MMM d, yyyy 'at' h:mm a")}
          </span>
        </li>
      ))}
    </ul>
  );
}
