"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useThemeStore } from "@/store/theme";
import { useAuthStore } from "@/store/auth";

// Rehydrates both Zustand persist stores from localStorage after mount.
// Both stores use skipHydration:true so the server render always starts from
// the initial (empty) state, preventing an SSR/client mismatch.
function StoreHydration() {
  useEffect(() => {
    useAuthStore.persist.rehydrate();
    useThemeStore.persist.rehydrate();
  }, []);
  return null;
}

function ThemeApplier() {
  const { isDark } = useThemeStore();
  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: 1 },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <StoreHydration />
      <ThemeApplier />
      {children}
    </QueryClientProvider>
  );
}
