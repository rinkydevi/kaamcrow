"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useThemeStore } from "@/store/theme";

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
      <ThemeApplier />
      {children}
    </QueryClientProvider>
  );
}
