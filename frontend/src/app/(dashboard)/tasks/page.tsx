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
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur dark:border-gray-800 dark:bg-gray-950/80">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <span className="text-lg font-bold text-indigo-600">TaskFlow</span>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{user?.email}</span>
            <button
              onClick={toggle}
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {isDark ? <SunIcon /> : <MoonIcon />}
            </button>
            <Button variant="secondary" size="sm" onClick={logout}>
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">My Tasks</h1>
            {data && (
              <p className="text-sm text-gray-500">
                {data.total} task{data.total !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          <Button
            onClick={() => {
              setEditingTask(null);
              setShowForm(true);
            }}
          >
            + New Task
          </Button>
        </div>

        <div className="mb-5">
          <TaskFiltersBar filters={filters} onChange={setFilters} />
        </div>

        {isLoading && (
          <div className="flex justify-center py-16">
            <svg className="h-8 w-8 animate-spin text-indigo-500" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          </div>
        )}

        {isError && (
          <div className="rounded-xl bg-red-50 p-6 text-center text-red-600 dark:bg-red-900/20">
            Failed to load tasks. Please try again.
          </div>
        )}

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
              <div className="mt-6 flex items-center justify-center gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={filters.page === 1}
                  onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-500">
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
