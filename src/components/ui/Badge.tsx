import { cn } from "@/lib/utils/cn";
import type { HTMLAttributes } from "react";

const variants = {
  default: "bg-surface-2 text-foreground border border-border",
  accent: "bg-accent/12 text-accent",
  success: "bg-success/12 text-success",
  warning: "bg-warning/12 text-warning",
  danger: "bg-danger/12 text-danger",
  info: "bg-info/12 text-info",
};

export function Badge({ className, variant = "default", ...props }: HTMLAttributes<HTMLSpanElement> & { variant?: keyof typeof variants }) {
  return <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium", variants[variant], className)} {...props} />;
}

export const PRIORITY_STYLES: Record<string, { variant: keyof typeof variants; label: string; dot: string }> = {
  critical: { variant: "danger", label: "Critical", dot: "#ef4444" },
  high: { variant: "warning", label: "High", dot: "#f59e0b" },
  medium: { variant: "info", label: "Medium", dot: "#3b82f6" },
  low: { variant: "default", label: "Low", dot: "#94a3b8" },
};

export function PriorityBadge({ priority }: { priority: string }) {
  const style = PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.medium;
  return (
    <Badge variant={style.variant}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: style.dot }} />
      {style.label}
    </Badge>
  );
}
