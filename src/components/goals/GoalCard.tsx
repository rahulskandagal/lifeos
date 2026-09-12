"use client";

import type { Goal } from "@/types";
import { Card, CardContent } from "@/components/ui/Card";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { apiMutate } from "@/lib/apiClient";
import { useSWRConfig } from "swr";
import { Check, Trash2, MoreHorizontal, Calendar } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils/cn";
import { toast } from "sonner";

export function GoalCard({ goal }: { goal: Goal }) {
  const { mutate } = useSWRConfig();

  async function toggleMilestone(milestoneId: string) {
    await apiMutate(`/api/goals/${goal.id}`, "PATCH", { action: "toggle-milestone", milestoneId });
    mutate((k) => typeof k === "string" && k.startsWith("/api/goals"));
    mutate("/api/dashboard");
  }

  async function handleDelete() {
    if (!confirm(`Delete goal "${goal.title}"?`)) return;
    await apiMutate(`/api/goals/${goal.id}`, "DELETE");
    toast.success("Goal deleted");
    mutate((k) => typeof k === "string" && k.startsWith("/api/goals"));
  }

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <ProgressRing value={goal.progress} size={52} strokeWidth={5} />
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{goal.title}</p>
              {goal.description && <p className="text-xs text-muted mt-0.5 line-clamp-2">{goal.description}</p>}
              {goal.targetDate && (
                <p className="text-[11px] text-muted mt-1 inline-flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> {new Date(goal.targetDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                </p>
              )}
            </div>
          </div>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="h-7 w-7 rounded-lg hover:bg-surface-2 flex items-center justify-center text-muted shrink-0 focus-ring">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content align="end" className="min-w-40 rounded-xl border border-border bg-surface p-1 shadow-xl z-50">
                <DropdownMenu.Item onSelect={handleDelete} className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm cursor-pointer hover:bg-danger/10 text-danger outline-none">
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>

        {!!goal.milestones?.length && (
          <div className="mt-3 space-y-1.5">
            {goal.milestones.map((m) => (
              <button key={m.id} onClick={() => toggleMilestone(m.id)} className="flex items-center gap-2 text-xs w-full text-left group">
                <span
                  className={cn(
                    "h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                    m.completed ? "bg-success border-success" : "border-border group-hover:border-accent"
                  )}
                >
                  {m.completed && <Check className="h-2.5 w-2.5 text-white" />}
                </span>
                <span className={cn(m.completed && "line-through text-muted")}>{m.title}</span>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
