"use client";
import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth";

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
            if (block.includes("event: task")) {
              qc.invalidateQueries({ queryKey: ["tasks"] });
            }
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        retryTimer = setTimeout(connect, 3000);
      }
    };

    connect();

    return () => {
      abortRef.current?.abort();
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [token, qc]);
}
