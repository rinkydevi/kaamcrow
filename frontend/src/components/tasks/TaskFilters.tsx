"use client";
import { useCallback } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { TaskFilters } from "@/types";

interface Props {
  filters: TaskFilters;
  onChange: (filters: TaskFilters) => void;
}

export function TaskFiltersBar({ filters, onChange }: Props) {
  const update = useCallback(
    (patch: Partial<TaskFilters>) => onChange({ ...filters, ...patch, page: 1 }),
    [filters, onChange]
  );

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="w-56">
        <Input
          placeholder="Search tasks..."
          value={filters.search ?? ""}
          onChange={(e) => update({ search: e.target.value })}
        />
      </div>

      <Select
        value={filters.status ?? ""}
        onChange={(e) => update({ status: e.target.value as TaskFilters["status"] })}
        className="w-36"
      >
        <option value="">All Statuses</option>
        <option value="todo">To Do</option>
        <option value="in_progress">In Progress</option>
        <option value="done">Done</option>
      </Select>

      <Select
        value={filters.sort_by ?? "created_at"}
        onChange={(e) => update({ sort_by: e.target.value as TaskFilters["sort_by"] })}
        className="w-40"
      >
        <option value="created_at">Date Created</option>
        <option value="due_date">Due Date</option>
        <option value="priority">Priority</option>
        <option value="title">Title</option>
      </Select>

      <Select
        value={filters.sort_dir ?? "desc"}
        onChange={(e) => update({ sort_dir: e.target.value as "asc" | "desc" })}
        className="w-28"
      >
        <option value="desc">Newest</option>
        <option value="asc">Oldest</option>
      </Select>
    </div>
  );
}
