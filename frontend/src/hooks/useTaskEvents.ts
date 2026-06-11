"use client";
import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth";
import type { Task, TaskListResponse } from "@/types";

interface TaskEvent {
  type: "created" | "updated" | "deleted";
  task?: Task;
  task_id?: string;
}

export function useTaskEvents() {
  const qc = useQueryClient();
  const { token } = useAuthStore();
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!token) return;

    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = async () => {
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/tasks/events", {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });

        if (!res.ok || !res.body) return;

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const blocks = buffer.split("\n\n");
          buffer = blocks.pop() ?? "";

          for (const block of blocks) {
            const eventLine = block.split("\n").find((l) => l.startsWith("event:"));
            const dataLine = block.split("\n").find((l) => l.startsWith("data:"));
            if (!eventLine?.includes("task") || !dataLine) continue;

            try {
              const event: TaskEvent = JSON.parse(dataLine.slice(5).trim());
              applyEvent(event);
            } catch {
              // malformed SSE payload — ignore
            }
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        retryTimer = setTimeout(connect, 3000);
      }
    };

    const applyEvent = (event: TaskEvent) => {
      if (event.type === "created") {
        // New task: page count and sort position unknown — full invalidation required.
        qc.invalidateQueries({ queryKey: ["tasks"] });
        return;
      }

      if (event.type === "updated" && event.task) {
        const updated = event.task;
        qc.setQueriesData<TaskListResponse>({ queryKey: ["tasks"] }, (old) => {
          if (!old) return old;
          return {
            ...old,
            tasks: old.tasks.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)),
          };
        });
        return;
      }

      if (event.type === "deleted" && event.task_id) {
        const deletedId = event.task_id;
        qc.setQueriesData<TaskListResponse>({ queryKey: ["tasks"] }, (old) => {
          if (!old) return old;
          return {
            ...old,
            tasks: old.tasks.filter((t) => t.id !== deletedId),
            total: Math.max(0, old.total - 1),
          };
        });
      }
    };

    connect();

    return () => {
      abortRef.current?.abort();
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [token, qc]);
}
