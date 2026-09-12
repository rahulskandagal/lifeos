"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/apiClient";
import { HabitCard } from "@/components/habits/HabitCard";
import { EmptyState, Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { useUIStore } from "@/lib/store/uiStore";
import type { Habit } from "@/types";
import { Plus, Flame, TrendingUp } from "lucide-react";

export default function HabitsPage() {
  const setHabitModalOpen = useUIStore((s) => s.setHabitModalOpen);
  const { data, isLoading } = useSWR<{ habits: Habit[] }>("/api/habits", fetcher);
  const habits = data?.habits ?? [];

  const avgSuccess = habits.length ? Math.round(habits.reduce((s, h) => s + (h.successPct ?? 0), 0) / habits.length) : 0;
  const bestStreak = habits.reduce((m, h) => Math.max(m, h.bestStreak ?? 0), 0);

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Habits</h1>
        <Button onClick={() => setHabitModalOpen(true)}>
          <Plus className="h-4 w-4" /> Add habit
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="card-surface p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-surface-2 flex items-center justify-center">🔁</div>
          <div>
            <p className="text-xs text-muted">Active habits</p>
            <p className="text-lg font-bold">{habits.length}</p>
          </div>
        </div>
        <div className="card-surface p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-surface-2 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-success" />
          </div>
          <div>
            <p className="text-xs text-muted">Avg success rate</p>
            <p className="text-lg font-bold">{avgSuccess}%</p>
          </div>
        </div>
        <div className="card-surface p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-surface-2 flex items-center justify-center">
            <Flame className="h-5 w-5 text-warning" />
          </div>
          <div>
            <p className="text-xs text-muted">Best streak</p>
            <p className="text-lg font-bold">{bestStreak}d</p>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      )}

      {!isLoading && !habits.length && (
        <EmptyState
          icon="🔁"
          title="No habits yet"
          description="Build consistency with daily habits like exercise, study, or reading."
          action={
            <Button size="sm" onClick={() => setHabitModalOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> Add your first habit
            </Button>
          }
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {habits.map((h) => (
          <HabitCard key={h.id} habit={h} />
        ))}
      </div>
    </div>
  );
}
