import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const PRIORITY_LABEL: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export const STATUS_LABEL: Record<string, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
};

/* Crow theme — vivid pill backgrounds matching new palette */
export const PRIORITY_COLOR: Record<string, string> = {
  low:    "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
  medium: "bg-violet-500/20 text-violet-300 border border-violet-500/35",
  high:   "bg-pink-500/20 text-pink-300 border border-pink-500/35",
};

export const STATUS_COLOR: Record<string, string> = {
  todo:        "bg-indigo-500/20 text-indigo-300 border border-indigo-500/35",
  in_progress: "bg-amber-500/20 text-amber-300 border border-amber-500/35",
  done:        "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
};

/* Dot colors matching the pill palette */
export const PRIORITY_DOT: Record<string, string> = {
  low:    "bg-emerald-400",
  medium: "bg-violet-400",
  high:   "bg-pink-400",
};

export const STATUS_DOT: Record<string, string> = {
  todo:        "bg-indigo-400",
  in_progress: "bg-amber-400",
  done:        "bg-emerald-400",
};
