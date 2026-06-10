"use client";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth";

export function useAuth() {
  const { user, token, setAuth, clearAuth } = useAuthStore();
  const router = useRouter();

  const login = async (email: string, password: string) => {
    const { data } = await api.post("/login", { email, password });
    setAuth(data.user, data.token);
    router.push("/tasks");
  };

  const signup = async (email: string, password: string) => {
    const { data } = await api.post("/signup", { email, password });
    setAuth(data.user, data.token);
    router.push("/tasks");
  };

  const logout = () => {
    clearAuth();
    router.push("/login");
  };

  return { user, token, login, signup, logout, isAuthenticated: !!token };
}
