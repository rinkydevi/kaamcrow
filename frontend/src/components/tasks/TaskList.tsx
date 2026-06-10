"use client";
import type { Task } from "@/types";
import { TaskCard } from "./TaskCard";

interface Props {
  tasks: Task[];
  onEdit: (task: Task) => void;
}

function EmptyCrow() {
  return (
    <svg viewBox="0 0 160 100" xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="h-24 w-24 text-crow-feather/40 animate-float" aria-hidden="true">
      <path d="M16 80 L40 66 L32 86 L48 70 L36 94 L54 74 L42 98" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round"/>
      <ellipse cx="76" cy="60" rx="36" ry="22"/>
      <path d="M44 54 Q62 28 92 42" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round"/>
      <circle cx="118" cy="42" r="18"/>
      <path d="M136 38 L154 42 L136 46 Z"/>
      <circle cx="124" cy="40" r="5" fill="white"/>
      <circle cx="125" cy="40" r="2.5" fill="#1a1a2e"/>
      <path d="M86 82 L82 100 M82 100 L74 108 M82 100 L82 110 M82 100 L90 108" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round"/>
    </svg>
  );
}

export function TaskList({ tasks, onEdit }: Props) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-crow-border py-20 text-center">
        <EmptyCrow />
        <p className="mt-5 text-base font-semibold text-crow-text">No tasks found</p>
        <p className="mt-1 text-sm text-crow-muted">The crow&apos;s perch is empty.</p>
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
