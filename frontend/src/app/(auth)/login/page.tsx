"use client";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useState } from "react";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

type FormData = z.infer<typeof schema>;

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

/* Large decorative background crow */
function BackgroundCrow() {
  return (
    <svg
      viewBox="0 0 400 260"
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      className="auth-crow-bg text-crow-feather"
      aria-hidden="true"
    >
      <path d="M40 200 L100 165 L80 215 L120 175 L90 235 L135 185 L105 245" stroke="currentColor" strokeWidth="7" fill="none" strokeLinecap="round"/>
      <ellipse cx="190" cy="150" rx="90" ry="55"/>
      <path d="M110 135 Q155 70 230 105" stroke="currentColor" strokeWidth="12" fill="none" strokeLinecap="round"/>
      <circle cx="295" cy="105" r="45"/>
      <path d="M340 95 L385 105 L340 115 Z"/>
      <circle cx="310" cy="100" r="12" fill="white"/>
      <circle cx="313" cy="100" r="6" fill="#1a1a2e"/>
      <path d="M215 205 L205 250 M205 250 L185 270 M205 250 L205 275 M205 250 L225 270" stroke="currentColor" strokeWidth="7" fill="none" strokeLinecap="round"/>
    </svg>
  );
}

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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4" style={{ background: "#07070f" }}>
      {/* Background gradient blobs */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute left-1/4 top-1/4 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/8 blur-3xl" />
        <div className="absolute right-1/4 bottom-1/4 h-80 w-80 translate-x-1/2 translate-y-1/2 rounded-full bg-cyan-500/6 blur-3xl" />
      </div>

      {/* Large decorative crow */}
      <BackgroundCrow />

      {/* Login card */}
      <div className="glass-card modal-gradient-border relative w-full max-w-sm rounded-2xl p-8">
        {/* Logo + title */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-crow-feather/10 border border-crow-feather/25">
            <CrowLogo className="h-9 w-9 text-crow-feather" />
          </div>
          <h1 className="gradient-text text-3xl font-bold tracking-tight">KaamCrow</h1>
          <p className="mt-2 text-sm italic text-crow-muted">Every task, a wing beat.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {error && (
            <div className="rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-400">
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

          <Button type="submit" loading={isSubmitting} className="mt-2 w-full py-3 text-sm">
            Sign In
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-crow-muted">
          No account yet?{" "}
          <Link href="/signup" className="font-semibold text-crow-feather hover:text-crow-shimmer transition-colors duration-200">
            Join the murder
          </Link>
        </p>
      </div>
    </div>
  );
}
