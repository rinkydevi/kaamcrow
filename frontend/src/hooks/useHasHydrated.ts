"use client";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth";

// Returns true once the Zustand auth store has been rehydrated from localStorage.
// Use this to guard any logic that depends on persisted auth state (e.g. redirect-to-login),
// so it never fires on the first SSR pass where localStorage is unavailable.
export function useHasHydrated() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    return useAuthStore.persist.onFinishHydration(() => setHydrated(true));
  }, []);

  return hydrated;
}
