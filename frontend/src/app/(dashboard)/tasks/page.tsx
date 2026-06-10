"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTasks, useCreateTask } from "@/hooks/useTasks";
import { useAuth } from "@/hooks/useAuth";
import { useTaskEvents } from "@/hooks/useTaskEvents";
import { useThemeStore } from "@/store/theme";
import { TaskList } from "@/components/tasks/TaskList";
import { TaskForm } from "@/components/tasks/TaskForm";
import { Button } from "@/components/ui/Button";
import { CrowLogo } from "@/components/ui/CrowLogo";
import type { Task, TaskFilters } from "@/types";

const DEFAULT_FILTERS: TaskFilters = {
  page: 1,
  limit: 20,
  sort_by: "created_at",
  sort_dir: "desc",
};

function SunIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="8" />
      <path strokeLinecap="round" d="m21 21-4.35-4.35" />
    </svg>
  );
}

function CrowSpinner() {
  return (
    <div className="flex flex-col items-center gap-4 py-20">
      <div className="relative flex h-14 w-14 items-center justify-center">
        <div
          className="absolute inset-0 rounded-full border-2 border-crow-border animate-spin-slow"
          style={{ borderTopColor: "rgb(var(--crow-accent))" }}
        />
        <CrowLogo className="h-7 w-7 text-crow-feather animate-crow-bob" />
      </div>
      <p className="text-sm text-crow-muted">Gathering tasks…</p>
    </div>
  );
}

const STATUS_TABS = [
  { value: "" as const,           label: "All" },
  { value: "todo" as const,       label: "Todo" },
  { value: "in_progress" as const, label: "In Progress" },
  { value: "done" as const,       label: "Done" },
] as const;

export default function TasksPage() {
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuth();
  const { isDark, toggle } = useThemeStore();
  const [filters, setFilters] = useState<TaskFilters>(DEFAULT_FILTERS);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showForm, setShowForm] = useState(false);

  /* Inline quick-add state */
  const [quickTitle, setQuickTitle] = useState("");
  const quickInputRef = useRef<HTMLInputElement>(null);
  const createTask = useCreateTask();

  const { data, isLoading, isError } = useTasks(filters);

  useTaskEvents();

  useEffect(() => {
    if (!isAuthenticated) router.replace("/login");
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = quickTitle.trim();
    if (!title) return;
    await createTask.mutateAsync({ title, status: "todo", priority: "medium" });
    setQuickTitle("");
    quickInputRef.current?.focus();
  };

  /* Counts for filter tabs (from current page data) */
  const counts = useMemo(() => {
    if (!data) return null;
    const tasks = data.tasks;
    return {
      all:         data.total,
      todo:        tasks.filter(t => t.status === "todo").length,
      in_progress: tasks.filter(t => t.status === "in_progress").length,
      done:        tasks.filter(t => t.status === "done").length,
    };
  }, [data]);

  const activeStatus = filters.status ?? "";

  return (
    <div className="min-h-screen">
      {/* ── Header ── */}
      <header
        className="sticky top-0 z-20 border-b border-crow-border"
        style={{ background: "var(--crow-header-bg)", backdropFilter: "blur(12px)" }}
      >
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <CrowLogo className="h-7 w-7 text-crow-text" />
            <div>
              <h1 className="text-base font-bold leading-tight text-crow-text">KaamCrow</h1>
              <p className="text-[11px] text-crow-muted leading-none">Every task, a wing beat.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-crow-muted sm:block truncate max-w-[160px]">
              {user?.email}
            </span>
            <button
              onClick={toggle}
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
              className="rounded-lg p-2 text-crow-muted hover:text-crow-text hover:bg-crow-shadow transition-all duration-150"
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? <SunIcon /> : <MoonIcon />}
            </button>
            <Button variant="secondary" size="sm" onClick={logout}>
              Sign out
            </Button>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="mx-auto max-w-3xl px-4 py-8 space-y-4">

        {/* Inline quick-add */}
        <form onSubmit={handleQuickAdd} className="flex gap-2">
          <input
            ref={quickInputRef}
            type="text"
            value={quickTitle}
            onChange={e => setQuickTitle(e.target.value)}
            placeholder="Add a new task…"
            className="crow-input flex-1 rounded-xl px-4 py-3 text-sm"
            disabled={createTask.isPending}
          />
          <Button
            type="submit"
            loading={createTask.isPending}
            disabled={!quickTitle.trim()}
            className="rounded-xl px-5 py-3 text-sm whitespace-nowrap"
          >
            + Add Task
          </Button>
        </form>

        {/* Search */}
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-crow-muted">
            <SearchIcon />
          </span>
          <input
            type="search"
            placeholder="Search tasks…"
            value={filters.search ?? ""}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))}
            className="crow-input w-full rounded-xl py-2.5 pl-10 pr-4 text-sm"
            aria-label="Search tasks"
          />
        </div>

        {/* Filter tabs + sort */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            {STATUS_TABS.map(tab => {
              const count = counts
                ? tab.value === ""
                  ? counts.all
                  : counts[tab.value as keyof typeof counts]
                : null;
              return (
                <button
                  key={tab.value}
                  onClick={() => setFilters(f => ({ ...f, status: tab.value as TaskFilters["status"], page: 1 }))}
                  className={`filter-pill ${activeStatus === tab.value ? "active" : ""}`}
                  aria-pressed={activeStatus === tab.value}
                >
                  {tab.label}
                  {count !== null && (
                    <span className="text-[11px] text-crow-muted">({count})</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-1.5">
            <select
              value={filters.sort_by ?? "created_at"}
              onChange={e => setFilters(f => ({ ...f, sort_by: e.target.value as TaskFilters["sort_by"], page: 1 }))}
              className="crow-input rounded-lg px-3 py-1.5 text-xs cursor-pointer appearance-none pr-6"
              style={{
                backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%23888'%3E%3Cpath fill-rule='evenodd' d='M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z' clip-rule='evenodd'/%3E%3C/svg%3E\")",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 0.4rem center",
                backgroundSize: "0.9rem",
              }}
              aria-label="Sort by"
            >
              <option value="created_at">Date Created</option>
              <option value="due_date">Due Date</option>
              <option value="priority">Priority</option>
              <option value="title">Title</option>
            </select>
            <button
              onClick={() => setFilters(f => ({ ...f, sort_dir: f.sort_dir === "desc" ? "asc" : "desc" }))}
              className={`filter-pill px-2.5 py-1.5 text-xs ${filters.sort_dir === "asc" ? "active" : ""}`}
              title={filters.sort_dir === "desc" ? "Newest first" : "Oldest first"}
              aria-label="Toggle sort direction"
            >
              {filters.sort_dir === "desc" ? "↓" : "↑"}
            </button>
          </div>
        </div>

        {/* Loading / Error / List */}
        {isLoading && <CrowSpinner />}

        {isError && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-5 text-center text-sm text-red-500">
            Failed to load tasks. Please try again.
          </div>
        )}

        {!isLoading && !isError && data && (
          <>
            <TaskList
              tasks={data.tasks}
              onEdit={(task: Task) => {
                setEditingTask(task);
                setShowForm(true);
              }}
            />

            {data.total_pages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={filters.page === 1}
                  onClick={() => setFilters(f => ({ ...f, page: (f.page ?? 1) - 1 }))}
                >
                  Previous
                </Button>
                <span className="text-xs text-crow-muted">
                  Page {data.page} of {data.total_pages}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={data.page >= data.total_pages}
                  onClick={() => setFilters(f => ({ ...f, page: (f.page ?? 1) + 1 }))}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Task form modal */}
      {showForm && (
        <TaskForm
          task={editingTask}
          onClose={() => {
            setShowForm(false);
            setEditingTask(null);
          }}
        />
      )}
    </div>
  );
}
