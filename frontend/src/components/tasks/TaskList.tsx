"use client";
import type { Task } from "@/types";
import { TaskCard } from "./TaskCard";

interface Props {
  tasks: Task[];
  onEdit: (task: Task) => void;
}

export function TaskList({ tasks, onEdit }: Props) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-16 text-gray-400 dark:border-gray-700">
        <svg className="mb-3 h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p className="text-sm font-medium">No tasks found</p>
        <p className="text-xs">Create a task to get started</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} onEdit={onEdit} />
      ))}
    </div>
  );
}
