"use client";
import type { Task } from "@/types";
import { TaskCard } from "./TaskCard";
import { CrowLogo } from "@/components/ui/CrowLogo";

export function TaskList({ tasks, onEdit }: Props) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <CrowLogo className="h-16 w-16 text-crow-muted/40 animate-float" aria-hidden="true" />
        <p className="mt-5 text-sm font-semibold text-crow-text">No tasks yet</p>
        <p className="mt-1 text-xs text-crow-muted">The crow&apos;s perch is empty. Add one above.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {tasks.map(task => (
        <TaskCard key={task.id} task={task} onEdit={onEdit} />
      ))}
    </div>
  );
}
