"use client";

import type { Task } from "@/types";
import { PriorityBadge } from "@/components/ui/Badge";
import { useUIStore } from "@/lib/store/uiStore";
import { apiMutate } from "@/lib/apiClient";
import { useSWRConfig } from "swr";
import { Check, Clock, MoreHorizontal, Copy, CalendarClock, Trash2, Pencil, MapPin, Repeat2, Sparkles } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils/cn";
import { toast } from "sonner";
import { useState } from "react";

const CATEGORY_ICONS: Record<string, string> = {
  Study: "📚",
  Work: "💻",
  Fitness: "🏋️",
  Personal: "🏠",
  Finance: "💰",
  Shopping: "🛒",
  Family: "👨‍👩‍👧",
  Goals: "🎯",
  Learning: "🧠",
  Ideas: "💡",
};

function refreshTasksAndDashboard(mutate: any) {
  mutate((key: any) => typeof key === "string" && (key.startsWith("/api/tasks") || key.startsWith("/api/dashboard") || key.startsWith("/api/calendar")));
}

export function TaskRow({ task, compact = false }: { task: Task; compact?: boolean }) {
  const openTaskModal = useUIStore((s) => s.openTaskModal);
  const { mutate } = useSWRConfig();
  const [busy, setBusy] = useState(false);
  const isCompleted = task.status === "completed";

  async function toggleComplete() {
    setBusy(true);
    try {
      if (isCompleted) {
        await apiMutate(`/api/tasks/${task.id}/actions`, "POST", { action: "uncomplete" });
      } else {
        const res: any = await apiMutate(`/api/tasks/${task.id}/actions`, "POST", { action: "complete", actualMinutes: task.estimatedMinutes });
        if (res?.newBadges?.length) {
          toast.success(`🏆 Badge earned: ${res.newBadges[0].title}!`);
        } else {
          toast.success("Task completed");
        }
      }
      refreshTasksAndDashboard(mutate);
    } finally {
      setBusy(false);
    }
  }

  async function handleSnooze(days: number) {
    const date = new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
    await apiMutate(`/api/tasks/${task.id}/actions`, "POST", { action: "snooze", date });
    toast.success(`Snoozed to ${date}`);
    refreshTasksAndDashboard(mutate);
  }

  async function handleDuplicate() {
    await apiMutate(`/api/tasks/${task.id}/actions`, "POST", { action: "duplicate" });
    toast.success("Task duplicated");
    refreshTasksAndDashboard(mutate);
  }

  async function handleDelete() {
    if (!confirm(`Delete "${task.title}"?`)) return;
    await apiMutate(`/api/tasks/${task.id}`, "DELETE");
    toast.success("Task deleted");
    refreshTasksAndDashboard(mutate);
  }

  async function handlePriorityChange(priority: string) {
    await apiMutate(`/api/tasks/${task.id}`, "PATCH", { priority });
    refreshTasksAndDashboard(mutate);
  }

  return (
    <div
      className={cn(
        "group flex items-start gap-3 rounded-xl px-3 py-2.5 hover:bg-surface-2 transition-colors",
        isCompleted && "opacity-60"
      )}
    >
      <button
        onClick={toggleComplete}
        disabled={busy}
        aria-label={isCompleted ? "Mark incomplete" : "Mark complete"}
        className={cn(
          "mt-0.5 h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors focus-ring",
          isCompleted ? "bg-success border-success" : "border-border hover:border-accent"
        )}
      >
        {isCompleted && <Check className="h-3 w-3 text-white" />}
      </button>

      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => openTaskModal({ task })}>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn("text-sm font-medium", isCompleted && "line-through text-muted")}>{task.title}</span>
          {!!task.aiPriorityScore && !compact && (
            <span className="inline-flex items-center gap-0.5 text-[10px] text-accent bg-accent/10 rounded px-1.5 py-0.5" title="AI Priority Score">
              <Sparkles className="h-2.5 w-2.5" /> {task.aiPriorityScore}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2.5 mt-1 flex-wrap text-xs text-muted">
          {task.startTime && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" /> {task.startTime}
              {task.endTime && `–${task.endTime}`}
            </span>
          )}
          {task.estimatedMinutes && !task.startTime && <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {task.estimatedMinutes}m</span>}
          {task.category && (
            <span className="inline-flex items-center gap-1">
              {CATEGORY_ICONS[task.category] ?? "📁"} {task.category}
            </span>
          )}
          {task.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {task.location}
            </span>
          )}
          {task.repeatRule && <Repeat2 className="h-3 w-3" />}
          {!!task.subtasks?.length && (
            <span>
              {task.subtasks.filter((s) => s.status === "completed").length}/{task.subtasks.length} subtasks
            </span>
          )}
          {task.postponeCount > 0 && <span className="text-warning">Postponed {task.postponeCount}×</span>}
        </div>
      </div>

      <PriorityBadge priority={task.priority} />

      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button className="opacity-0 group-hover:opacity-100 focus:opacity-100 h-7 w-7 rounded-lg hover:bg-surface flex items-center justify-center text-muted shrink-0 transition-opacity focus-ring">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content align="end" className="min-w-44 rounded-xl border border-border bg-surface p-1 shadow-xl z-50">
            <DropdownMenu.Item onSelect={() => openTaskModal({ task })} className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm cursor-pointer hover:bg-surface-2 outline-none">
              <Pencil className="h-3.5 w-3.5" /> Edit
            </DropdownMenu.Item>
            <DropdownMenu.Item onSelect={() => handleSnooze(1)} className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm cursor-pointer hover:bg-surface-2 outline-none">
              <CalendarClock className="h-3.5 w-3.5" /> Snooze to tomorrow
            </DropdownMenu.Item>
            <DropdownMenu.Sub>
              <DropdownMenu.SubTrigger className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm cursor-pointer hover:bg-surface-2 outline-none">
                Change priority
              </DropdownMenu.SubTrigger>
              <DropdownMenu.Portal>
                <DropdownMenu.SubContent className="min-w-32 rounded-xl border border-border bg-surface p-1 shadow-xl z-50">
                  {["critical", "high", "medium", "low"].map((p) => (
                    <DropdownMenu.Item key={p} onSelect={() => handlePriorityChange(p)} className="rounded-lg px-2.5 py-2 text-sm cursor-pointer hover:bg-surface-2 outline-none capitalize">
                      {p}
                    </DropdownMenu.Item>
                  ))}
                </DropdownMenu.SubContent>
              </DropdownMenu.Portal>
            </DropdownMenu.Sub>
            <DropdownMenu.Item onSelect={handleDuplicate} className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm cursor-pointer hover:bg-surface-2 outline-none">
              <Copy className="h-3.5 w-3.5" /> Duplicate
            </DropdownMenu.Item>
            <DropdownMenu.Separator className="h-px bg-border my-1" />
            <DropdownMenu.Item onSelect={handleDelete} className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm cursor-pointer hover:bg-danger/10 text-danger outline-none">
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
}
