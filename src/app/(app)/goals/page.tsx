"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/apiClient";
import { GoalCard } from "@/components/goals/GoalCard";
import { EmptyState, Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { useUIStore } from "@/lib/store/uiStore";
import type { Goal } from "@/types";
import { Plus } from "lucide-react";

const TERMS: { key: Goal["term"]; label: string; hint: string }[] = [
  { key: "short", label: "Short-term goals", hint: "Daily / Weekly" },
  { key: "medium", label: "Medium-term goals", hint: "Monthly / Quarterly" },
  { key: "long", label: "Long-term goals", hint: "Yearly / Life" },
];

export default function GoalsPage() {
  const setGoalModalOpen = useUIStore((s) => s.setGoalModalOpen);
  const { data, isLoading } = useSWR<{ goals: Goal[] }>("/api/goals", fetcher);
  const goals = data?.goals ?? [];

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Goals</h1>
        <Button onClick={() => setGoalModalOpen(true)}>
          <Plus className="h-4 w-4" /> Add goal
        </Button>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      )}

      {!isLoading &&
        TERMS.map((term) => {
          const items = goals.filter((g) => g.term === term.key);
          return (
            <div key={term.key}>
              <div className="flex items-baseline gap-2 mb-3">
                <h2 className="text-sm font-semibold">{term.label}</h2>
                <span className="text-xs text-muted">{term.hint}</span>
              </div>
              {!items.length && <p className="text-xs text-muted mb-4">No {term.label.toLowerCase()} yet.</p>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                {items.map((g) => (
                  <GoalCard key={g.id} goal={g} />
                ))}
              </div>
            </div>
          );
        })}

      {!isLoading && !goals.length && (
        <EmptyState
          icon="🎯"
          title="No goals yet"
          description="Set short, medium, and long-term goals and track your progress with milestones."
          action={
            <Button size="sm" onClick={() => setGoalModalOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> Add your first goal
            </Button>
          }
        />
      )}
    </div>
  );
}
