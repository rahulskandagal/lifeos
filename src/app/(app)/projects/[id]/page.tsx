"use client";

import { use, useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/apiClient";
import { KanbanBoard } from "@/components/tasks/KanbanBoard";
import { TaskRow } from "@/components/tasks/TaskRow";
import { Button } from "@/components/ui/Button";
import { useUIStore } from "@/lib/store/uiStore";
import { cn } from "@/lib/utils/cn";
import { Plus, ArrowLeft, Users, Calendar, Kanban, List, GanttChartSquare } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/Skeleton";

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading } = useSWR<{ project: any; tasks: any[] }>(`/api/projects/${id}`, fetcher);
  const openTaskModal = useUIStore((s) => s.openTaskModal);
  const [view, setView] = useState<"list" | "kanban" | "timeline">("kanban");

  if (isLoading) return <div className="max-w-6xl mx-auto px-4 md:px-6 py-6"><Skeleton className="h-64 w-full" /></div>;
  if (!data?.project) return <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">Project not found.</div>;

  const { project, tasks } = data;
  const topLevel = tasks.filter((t) => !t.parentTaskId);
  const sortedByDate = [...topLevel].filter((t) => t.date).sort((a, b) => (a.date > b.date ? 1 : -1));

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-5">
      <Link href="/projects" className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> All projects
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ background: project.color }} />
            <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
          </div>
          {project.description && <p className="text-sm text-muted mt-1 max-w-xl">{project.description}</p>}
          <div className="flex items-center gap-4 mt-2 text-xs text-muted">
            {!!project.members?.length && (
              <span className="inline-flex items-center gap-1">
                <Users className="h-3.5 w-3.5" /> {project.members.map((m: any) => m.name).join(", ")}
              </span>
            )}
            {project.deadline && (
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> Due {new Date(project.deadline).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        <Button onClick={() => openTaskModal({ initial: { projectId: project.id } as any })}>
          <Plus className="h-4 w-4" /> Add task
        </Button>
      </div>

      {!!project.milestones?.length && (
        <div className="flex flex-wrap gap-2">
          {project.milestones.map((m: any) => (
            <span key={m.id} className={cn("text-xs rounded-full px-3 py-1 border", m.completed ? "bg-success/10 border-success/30 text-success" : "border-border text-muted")}>
              {m.completed ? "✓ " : ""}
              {m.title}
            </span>
          ))}
        </div>
      )}

      <div className="flex rounded-lg border border-border p-0.5 bg-surface w-fit">
        <button onClick={() => setView("list")} className={cn("h-8 px-3 rounded-md text-xs font-medium flex items-center gap-1.5", view === "list" ? "bg-accent/12 text-accent" : "text-muted")}>
          <List className="h-3.5 w-3.5" /> List
        </button>
        <button onClick={() => setView("kanban")} className={cn("h-8 px-3 rounded-md text-xs font-medium flex items-center gap-1.5", view === "kanban" ? "bg-accent/12 text-accent" : "text-muted")}>
          <Kanban className="h-3.5 w-3.5" /> Board
        </button>
        <button onClick={() => setView("timeline")} className={cn("h-8 px-3 rounded-md text-xs font-medium flex items-center gap-1.5", view === "timeline" ? "bg-accent/12 text-accent" : "text-muted")}>
          <GanttChartSquare className="h-3.5 w-3.5" /> Timeline
        </button>
      </div>

      {view === "kanban" && <KanbanBoard tasks={topLevel} />}
      {view === "list" && (
        <div className="card-surface p-2 space-y-0.5">
          {topLevel.map((t) => (
            <TaskRow key={t.id} task={t} />
          ))}
          {!topLevel.length && <p className="text-xs text-muted text-center py-8">No tasks in this project yet.</p>}
        </div>
      )}
      {view === "timeline" && (
        <div className="card-surface p-4 space-y-2">
          {sortedByDate.map((t) => (
            <div key={t.id} className="flex items-center gap-3 text-sm">
              <span className="w-24 text-xs text-muted shrink-0">{new Date(t.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
              <div className="flex-1 h-2 rounded-full bg-surface-2 relative overflow-hidden">
                <div className={cn("absolute inset-y-0 left-0 rounded-full", t.status === "completed" ? "bg-success" : "bg-accent")} style={{ width: "60%" }} />
              </div>
              <span className="truncate max-w-[40%]">{t.title}</span>
            </div>
          ))}
          {!sortedByDate.length && <p className="text-xs text-muted text-center py-8">No dated tasks to show on a timeline yet.</p>}
        </div>
      )}
    </div>
  );
}
