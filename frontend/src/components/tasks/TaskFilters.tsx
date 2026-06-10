"use client";
import { useCallback } from "react";
import type { TaskFilters } from "@/types";

interface Props {
  filters: TaskFilters;
  onChange: (filters: TaskFilters) => void;
}

function SearchIcon() {
  return (
    <svg className="h-3.5 w-3.5 text-crow-muted" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="8" />
      <path strokeLinecap="round" d="m21 21-4.35-4.35" />
    </svg>
  );
}

export function TaskFiltersBar({ filters, onChange }: Props) {
  const update = useCallback(
    (patch: Partial<TaskFilters>) => onChange({ ...filters, ...patch, page: 1 }),
    [filters, onChange]
  );

  const currentStatus = filters.status ?? "";
  const currentSort  = filters.sort_by ?? "created_at";
  const currentDir   = filters.sort_dir ?? "desc";

  return (
    <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1">
      {/* Search */}
      <div className="relative flex-shrink-0">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
          <SearchIcon />
        </span>
        <input
          type="search"
          placeholder="Search tasks…"
          value={filters.search ?? ""}
          onChange={(e) => update({ search: e.target.value })}
          className="crow-input rounded-full pl-8 pr-4 py-2 text-sm w-52 focus:w-64 transition-all duration-300"
          aria-label="Search tasks"
        />
      </div>

      {/* Status pills */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {(["", "todo", "in_progress", "done"] as const).map((val) => {
          const label = val === "" ? "All" : val === "todo" ? "To Do" : val === "in_progress" ? "In Progress" : "Done";
          return (
            <button
              key={val}
              onClick={() => update({ status: val as TaskFilters["status"] })}
              className={`filter-pill ${currentStatus === val ? "active" : ""}`}
              aria-pressed={currentStatus === val}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Sort select pill */}
      <div className="flex items-center gap-1.5 flex-shrink-0 ml-auto">
        <select
          value={currentSort}
          onChange={(e) => update({ sort_by: e.target.value as TaskFilters["sort_by"] })}
          className="crow-input rounded-full px-3 py-2 text-xs cursor-pointer bg-transparent border-crow-border/60 text-crow-muted hover:border-crow-feather/50 hover:text-crow-text transition-all duration-200 appearance-none pr-7"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%236b6b9a'%3E%3Cpath fill-rule='evenodd' d='M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z' clip-rule='evenodd'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 0.5rem center", backgroundSize: "1rem" }}
          aria-label="Sort by"
        >
          <option value="created_at">Date Created</option>
          <option value="due_date">Due Date</option>
          <option value="priority">Priority</option>
          <option value="title">Title</option>
        </select>

        <button
          onClick={() => update({ sort_dir: currentDir === "desc" ? "asc" : "desc" })}
          className={`filter-pill px-2.5 py-2 ${currentDir === "asc" ? "active" : ""}`}
          title={currentDir === "desc" ? "Newest first — click for oldest" : "Oldest first — click for newest"}
          aria-label="Toggle sort direction"
        >
          {currentDir === "desc" ? (
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
            </svg>
          ) : (
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
