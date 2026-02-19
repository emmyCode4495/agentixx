import { type HTMLAttributes } from "react"
import { cn } from "@/lib/utils"

type BadgeVariant = "default" | "primary" | "success" | "warning" | "danger"

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const variants: Record<BadgeVariant, string> = {
  default: "bg-[var(--muted)] text-[var(--muted-foreground)] border-[var(--border)]",
  primary: "bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20",
  success: "bg-emerald-900/30 text-emerald-400 border-emerald-900/50",
  warning: "bg-amber-900/30 text-amber-400 border-amber-900/50",
  danger: "bg-red-900/30 text-red-400 border-red-900/50",
}

export function Badge({ variant = "default", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
      {...props}
    />
  )
}