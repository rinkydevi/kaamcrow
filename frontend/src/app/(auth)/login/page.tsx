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

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setError("");
    try {
      await login(data.email, data.password);
    } catch {
      setError("Invalid email or password");
    }
  };

  return (
    <div
      className="relative flex min-h-screen items-center justify-center p-4"
      style={{ background: "rgb(var(--crow-bg))" }}
    >
      {/* Subtle crow silhouette */}
      <svg
        viewBox="0 0 400 260"
        fill="currentColor"
        className="auth-crow-bg text-crow-text"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
      >
        <polygon points="72,128 144,108 144,148" />
        <circle cx="204" cy="96" r="64" />
        <path d="M144 152 C136 192 152 240 208 256 C256 272 312 232 320 184 C328 136 296 96 240 96 L204 144 Z" />
        <path d="M160 192 Q216 152 288 160 Q224 200 160 224 Z" />
        <path d="M312 192 L392 160 L400 200 L312 224 Z" />
      </svg>

      {/* Card */}
      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-crow-border bg-crow-shadow">
            <CrowLogo className="h-7 w-7 text-crow-text" />
          </div>
          <h1 className="text-2xl font-bold text-crow-text">KaamCrow</h1>
          <p className="mt-1.5 text-sm text-crow-muted">Every task, a wing beat.</p>
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
              placeholder="••••••••"
              error={errors.password?.message}
              {...register("password")}
            />
            <Button type="submit" loading={isSubmitting} className="mt-1 w-full py-2.5 text-sm">
              Sign In
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-crow-muted">
            No account yet?{" "}
            <Link href="/signup" className="font-semibold text-crow-text hover:text-crow-feather transition-colors duration-150">
              Join the murder
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
