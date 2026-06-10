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

export const PRIORITY_COLOR: Record<string, string> = {
  low: "bg-blue-100 text-blue-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-red-100 text-red-700",
};

export const STATUS_COLOR: Record<string, string> = {
  todo: "bg-gray-100 text-gray-700",
  in_progress: "bg-purple-100 text-purple-700",
  done: "bg-green-100 text-green-700",
};
