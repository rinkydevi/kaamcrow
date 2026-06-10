import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const variants = {
  primary:
    "btn-gradient text-white font-semibold shadow-lg focus:ring-2 focus:ring-crow-feather/60 focus:ring-offset-2 focus:ring-offset-crow-void disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none",
  secondary:
    "bg-crow-shadow text-crow-text border border-crow-border hover:border-crow-feather/50 hover:bg-crow-border/60 focus:ring-2 focus:ring-crow-feather/40 focus:ring-offset-2 focus:ring-offset-crow-void transition-all duration-200",
  danger:
    "bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30 hover:border-red-400/50 focus:ring-2 focus:ring-red-500/40 focus:ring-offset-2 focus:ring-offset-crow-void transition-all duration-200",
  ghost:
    "text-crow-muted hover:text-crow-feather hover:bg-crow-feather/10 focus:ring-2 focus:ring-crow-feather/30 focus:ring-offset-1 focus:ring-offset-crow-void transition-all duration-200",
};

const sizes = {
  sm: "px-3 py-1.5 text-xs rounded-lg",
  md: "px-4 py-2 text-sm rounded-lg",
  lg: "px-6 py-3 text-base rounded-xl",
};

export const Button = forwardRef<HTMLButtonElement, Props>(
  ({ className, variant = "primary", size = "md", loading, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 focus:outline-none disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading && (
        <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      )}
      {children}
    </button>
  )
);
Button.displayName = "Button";
