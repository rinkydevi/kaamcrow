import { cn } from "@/lib/utils";

interface Props {
  children: React.ReactNode;
  className?: string;
}

export function Badge({ children, className }: Props) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", className)}>
      {children}
    </span>
  );
}
