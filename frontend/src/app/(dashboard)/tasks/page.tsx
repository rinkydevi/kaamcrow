"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTasks } from "@/hooks/useTasks";
import { useAuth } from "@/hooks/useAuth";
import { useTaskEvents } from "@/hooks/useTaskEvents";
import { useThemeStore } from "@/store/theme";
import { TaskList } from "@/components/tasks/TaskList";
import { TaskForm } from "@/components/tasks/TaskForm";
import { TaskFiltersBar } from "@/components/tasks/TaskFilters";
import { Button } from "@/components/ui/Button";
import type { Task, TaskFilters } from "@/types";

const DEFAULT_FILTERS: TaskFilters = {
  page: 1,
  limit: 20,
  sort_by: "created_at",
  sort_dir: "desc",
};

function CrowLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 50" xmlns="http://www.w3.org/2000/svg" fill="currentColor" className={className}>
      <path d="M8 40 L20 33 L16 43 L24 35 L18 47 L27 37 L21 49" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <ellipse cx="38" cy="30" rx="18" ry="11"/>
      <path d="M22 27 Q31 14 46 21" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <circle cx="59" cy="21" r="9"/>
      <path d="M68 19 L77 21 L68 23 Z"/>
      <circle cx="62" cy="20" r="2.5" fill="white"/>
      <circle cx="62.5" cy="20" r="1.2" fill="#1a1a2e"/>
      <path d="M43 41 L41 50 M41 50 L37 54 M41 50 L41 55 M41 50 L45 54" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    </svg>
  );
}

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

function PlusIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

function CrowSpinner() {
  return (
    <div className="flex flex-col items-center gap-4 py-20">
      <div className="relative flex h-16 w-16 items-center justify-center">
        <div className="absolute inset-0 rounded-full border-2 border-crow-feather/20 animate-spin-slow" style={{ borderTopColor: "var(--crow-feather)" }} />
        <CrowLogo className="h-8 w-8 text-crow-feather animate-crow-bob" />
      </div>
      <p className="text-sm text-crow-muted">Gathering tasks…</p>
    </div>
  );
}

export default function TasksPage() {
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuth();
  const { isDark, toggle } = useThemeStore();
  const [filters, setFilters] = useState<TaskFilters>(DEFAULT_FILTERS);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading, isError } = useTasks(filters);

  useTaskEvents();

  useEffect(() => {
    if (!isAuthenticated) router.replace("/login");
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen">
      {/* ── Header ── */}
      <header className="sticky top-0 z-20 border-b border-crow-border/60 bg-crow-void/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-crow-feather/10 border border-crow-feather/20">
              <CrowLogo className="h-6 w-6 text-crow-feather" />
            </div>
            <span className="gradient-text text-lg font-bold tracking-tight">KaamCrow</span>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-crow-muted sm:block truncate max-w-[180px]">
              {user?.email}
            </span>
            <button
              onClick={toggle}
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
              className="rounded-lg p-2 text-crow-muted hover:text-crow-feather hover:bg-crow-feather/10 transition-all duration-200"
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
      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Page title row */}
        <div className="mb-7 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-crow-text">My Tasks</h1>
            {data && (
              <span className="inline-flex items-center rounded-full bg-crow-feather/15 border border-crow-feather/25 px-3 py-0.5 text-xs font-semibold text-crow-feather">
                {data.total} {data.total === 1 ? "task" : "tasks"}
              </span>
            )}
          </div>
          <Button
            onClick={() => {
              setEditingTask(null);
              setShowForm(true);
            }}
            className="gap-2 px-4 py-2"
          >
            <PlusIcon />
            New Task
          </Button>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <TaskFiltersBar filters={filters} onChange={setFilters} />
        </div>

        {/* Loading */}
        {isLoading && <CrowSpinner />}

        {/* Error */}
        {isError && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-center text-sm text-red-400">
            Failed to load tasks. Please try again.
          </div>
        )}

        {/* Task list + pagination */}
        {!isLoading && !isError && data && (
          <>
            <TaskList
              tasks={data.tasks}
              onEdit={(task) => {
                setEditingTask(task);
                setShowForm(true);
              }}
            />

            {data.total_pages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={filters.page === 1}
                  onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}
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
                  onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}
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
