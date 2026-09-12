"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/apiClient";
import { Card, CardContent } from "@/components/ui/Card";
import { TaskRow } from "@/components/tasks/TaskRow";
import { KanbanBoard } from "@/components/tasks/KanbanBoard";
import { EmptyState, Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useUIStore } from "@/lib/store/uiStore";
import { cn } from "@/lib/utils/cn";
import { Plus, Search, List, Kanban } from "lucide-react";
import type { Task } from "@/types";

const FILTERS = ["All", "Today", "Tomorrow", "Upcoming", "Overdue", "Completed"] as const;
const PRIORITIES = ["critical", "high", "medium", "low"];
const CATEGORIES = ["Study", "Work", "Fitness", "Personal", "Finance", "Shopping", "Family", "Goals", "Learning", "Ideas"];

function isoDate(offsetDays = 0) {
  return new Date(Date.now() + offsetDays * 86400000).toISOString().slice(0, 10);
}

export default function TasksPage() {
  const openTaskModal = useUIStore((s) => s.openTaskModal);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [priority, setPriority] = useState("");
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"list" | "kanban">("list");

  const { data, isLoading } = useSWR<{ tasks: Task[] }>("/api/tasks?topLevelOnly=true", fetcher);
  const tasks = data?.tasks ?? [];

  const filtered = useMemo(() => {
    let result = tasks;
    const today = isoDate(0);
    const tomorrow = isoDate(1);
    if (filter === "Today") result = result.filter((t) => t.date === today);
    else if (filter === "Tomorrow") result = result.filter((t) => t.date === tomorrow);
    else if (filter === "Upcoming") result = result.filter((t) => t.date && t.date > today && t.status !== "completed");
    else if (filter === "Overdue") result = result.filter((t) => t.date && t.date < today && t.status !== "completed");
    else if (filter === "Completed") result = result.filter((t) => t.status === "completed");
    else result = result.filter((t) => t.status !== "completed" || filter === ("All" as any));

    if (priority) result = result.filter((t) => t.priority === priority);
    if (category) result = result.filter((t) => t.category === category);
    if (search) result = result.filter((t) => t.title.toLowerCase().includes(search.toLowerCase()));
    return result;
  }, [tasks, filter, priority, category, search]);

  const grouped = useMemo(() => {
    const groups: Record<string, Task[]> = { "No date": [] };
    for (const t of filtered) {
      const key = t.date ?? "No date";
      (groups[key] ??= []).push(t);
    }
    return Object.entries(groups)
      .filter(([, v]) => v.length)
      .sort(([a], [b]) => (a === "No date" ? 1 : b === "No date" ? -1 : a.localeCompare(b)));
  }, [filtered]);

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border p-0.5 bg-surface">
            <button onClick={() => setView("list")} className={cn("h-8 px-2.5 rounded-md flex items-center gap-1.5 text-xs font-medium", view === "list" ? "bg-accent/12 text-accent" : "text-muted")}>
              <List className="h-3.5 w-3.5" /> List
            </button>
            <button onClick={() => setView("kanban")} className={cn("h-8 px-2.5 rounded-md flex items-center gap-1.5 text-xs font-medium", view === "kanban" ? "bg-accent/12 text-accent" : "text-muted")}>
              <Kanban className="h-3.5 w-3.5" /> Board
            </button>
          </div>
          <Button onClick={() => openTaskModal()}>
            <Plus className="h-4 w-4" /> Add task
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tasks…" className="pl-9 w-56" />
        </div>
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn("h-9 px-3 rounded-lg text-sm font-medium transition-colors", filter === f ? "bg-accent/12 text-accent" : "text-muted hover:bg-surface-2")}
          >
            {f}
          </button>
        ))}
        <select value={priority} onChange={(e) => setPriority(e.target.value)} className="h-9 rounded-lg border border-border bg-surface px-2.5 text-sm">
          <option value="">Any priority</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p[0].toUpperCase() + p.slice(1)}
            </option>
          ))}
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-9 rounded-lg border border-border bg-surface px-2.5 text-sm">
          <option value="">Any category</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      )}

      {!isLoading && view === "list" && (
        <>
          {!filtered.length && (
            <EmptyState
              icon="📋"
              title="No tasks match this view"
              description="Try a different filter, or add a new task."
              action={
                <Button size="sm" onClick={() => openTaskModal()}>
                  <Plus className="h-3.5 w-3.5" /> Add task
                </Button>
              }
            />
          )}
          <div className="space-y-4">
            {grouped.map(([date, items]) => (
              <Card key={date}>
                <div className="px-4 pt-3 pb-1 text-xs font-semibold text-muted uppercase tracking-wide">
                  {date === "No date" ? "No date" : new Date(date).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
                </div>
                <CardContent className="pt-1 space-y-0.5">
                  {items.map((t) => (
                    <TaskRow key={t.id} task={t} />
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {!isLoading && view === "kanban" && <KanbanBoard tasks={filtered} />}
    </div>
  );
}
