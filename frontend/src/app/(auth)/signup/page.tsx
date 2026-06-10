"use client";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { CrowLogo } from "@/components/ui/CrowLogo";
import { useState } from "react";
import { useThemeStore } from "@/store/theme";

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

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof schema>;

export default function SignupPage() {
  const { signup } = useAuth();
  const { isDark, toggle } = useThemeStore();
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setError("");
    try {
      await signup(data.email, data.password);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg ?? "Failed to create account");
    }
  };

  return (
    <div
      className="relative flex min-h-screen items-center justify-center p-4"
      style={{ background: "rgb(var(--crow-bg))" }}
    >
      {/* Theme toggle */}
      <button
        onClick={toggle}
        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        className="absolute top-4 right-4 rounded-lg p-2 text-crow-muted hover:text-crow-text hover:bg-crow-surface transition-all duration-150"
      >
        {isDark ? <SunIcon /> : <MoonIcon />}
      </button>

      {/* Card */}
      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center">
            <CrowLogo size={48} />
          </div>
          <h1 className="text-2xl font-bold text-crow-text">KaamCrow</h1>
          <p className="mt-1.5 text-sm text-crow-muted">Join the murder.</p>
        </div>

        {/* Form card */}
        <div
          className="rounded-2xl border border-crow-border p-6"
          style={{ background: "rgb(var(--crow-surface))", boxShadow: "var(--crow-card-shadow)" }}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            {error && (
              <div className="rounded-lg border border-red-500/25 bg-red-500/8 px-4 py-3 text-sm text-red-500">
                {error}
              </div>
            )}
            <Input
              label="Email"
              id="email"
              type="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register("email")}
            />
            <Input
              label="Password"
              id="password"
              type="password"
              placeholder="Min. 8 characters"
              error={errors.password?.message}
              {...register("password")}
            />
            <Input
              label="Confirm Password"
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              error={errors.confirmPassword?.message}
              {...register("confirmPassword")}
            />
            <Button type="submit" loading={isSubmitting} className="mt-1 w-full py-2.5 text-sm">
              Create Account
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-crow-muted">
            Already flying?{" "}
            <Link href="/login" className="font-semibold text-crow-text hover:text-crow-feather transition-colors duration-150">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
