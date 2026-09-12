"use client";

import type { Habit } from "@/types";
import { Card, CardContent } from "@/components/ui/Card";
import { apiMutate } from "@/lib/apiClient";
import { useSWRConfig } from "swr";
import { addDays, toISODate } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";
import { Flame, Trash2, MoreHorizontal } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { toast } from "sonner";

export function HabitCard({ habit }: { habit: Habit }) {
  const { mutate } = useSWRConfig();
  const today = new Date();
  const last7 = Array.from({ length: 7 }, (_, i) => addDays(today, -(6 - i)));
  const logDates = new Set(habit.logs?.filter((l) => l.completed).map((l) => l.date));

  async function toggleDay(dateStr: string) {
    await apiMutate(`/api/habits/${habit.id}`, "PATCH", { action: "toggle-log", date: dateStr });
    mutate("/api/habits");
    mutate("/api/dashboard");
  }

  async function handleDelete() {
    if (!confirm(`Delete habit "${habit.name}"?`)) return;
    await apiMutate(`/api/habits/${habit.id}`, "DELETE");
    toast.success("Habit deleted");
    mutate("/api/habits");
  }

  // last 30 days mini heatmap
  const last30 = Array.from({ length: 30 }, (_, i) => addDays(today, -(29 - i)));

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center text-lg" style={{ background: `${habit.color}20` }}>
              {habit.icon}
            </div>
            <div>
              <p className="text-sm font-semibold">{habit.name}</p>
              <p className="text-xs text-muted">{habit.category ?? "General"} · {habit.targetPerWeek}x/week</p>
            </div>
          </div>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="h-7 w-7 rounded-lg hover:bg-surface-2 flex items-center justify-center text-muted focus-ring">
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

        <div className="flex items-center gap-3 text-xs text-muted mb-3">
          <span className="inline-flex items-center gap-1 text-warning font-medium">
            <Flame className="h-3.5 w-3.5" /> {habit.currentStreak ?? 0} day streak
          </span>
          <span>Best: {habit.bestStreak ?? 0}</span>
          <span>Success: {habit.successPct ?? 0}%</span>
        </div>

        <div className="flex items-center justify-between gap-1 mb-3">
          {last7.map((d) => {
            const dateStr = toISODate(d);
            const done = logDates.has(dateStr);
            return (
              <button
                key={dateStr}
                onClick={() => toggleDay(dateStr)}
                className={cn(
                  "flex-1 flex flex-col items-center gap-1 rounded-lg py-1.5 transition-colors",
                  done ? "text-white" : "bg-surface-2 text-muted hover:bg-border/60"
                )}
                style={done ? { background: habit.color } : undefined}
              >
                <span className="text-[9px]">{d.toLocaleDateString(undefined, { weekday: "narrow" })}</span>
                <span className="text-xs font-semibold">{d.getDate()}</span>
              </button>
            );
          })}
        </div>

        <div className="grid gap-0.5" style={{ gridTemplateColumns: "repeat(30, minmax(0, 1fr))" }}>
          {last30.map((d) => {
            const dateStr = toISODate(d);
            const done = logDates.has(dateStr);
            return <div key={dateStr} className="h-2.5 rounded-sm" style={{ background: done ? habit.color : "var(--surface-2)" }} title={dateStr} />;
          })}
        </div>
      </CardContent>
    </Card>
  );
}
