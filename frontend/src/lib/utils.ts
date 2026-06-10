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

/* Crow theme — semi-transparent pill backgrounds + matching text */
export const PRIORITY_COLOR: Record<string, string> = {
  low:    "bg-cyan-500/15 text-cyan-300 border border-cyan-500/25",
  medium: "bg-blue-500/15 text-blue-300 border border-blue-500/25",
  high:   "bg-violet-500/15 text-violet-300 border border-violet-500/25",
};

export const STATUS_COLOR: Record<string, string> = {
  todo:        "bg-blue-500/15 text-blue-300 border border-blue-500/25",
  in_progress: "bg-amber-500/15 text-amber-300 border border-amber-500/25",
  done:        "bg-teal-500/15 text-teal-300 border border-teal-500/25",
};

/* Dot colors matching the pill palette */
export const PRIORITY_DOT: Record<string, string> = {
  low:    "bg-cyan-400",
  medium: "bg-blue-400",
  high:   "bg-violet-400",
};

export const STATUS_DOT: Record<string, string> = {
  todo:        "bg-blue-400",
  in_progress: "bg-amber-400",
  done:        "bg-teal-400",
};
