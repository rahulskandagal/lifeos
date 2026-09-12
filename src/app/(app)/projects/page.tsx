"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/apiClient";
import { Button } from "@/components/ui/Button";
import { EmptyState, Skeleton } from "@/components/ui/Skeleton";
import { useUIStore } from "@/lib/store/uiStore";
import type { Project } from "@/types";
import { Plus, Users, Calendar } from "lucide-react";
import Link from "next/link";

export default function ProjectsPage() {
  const setProjectModalOpen = useUIStore((s) => s.setProjectModalOpen);
  const { data, isLoading } = useSWR<{ projects: Project[] }>("/api/projects", fetcher);
  const projects = data?.projects ?? [];

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
        <Button onClick={() => setProjectModalOpen(true)}>
          <Plus className="h-4 w-4" /> New project
        </Button>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      )}

      {!isLoading && !projects.length && (
        <EmptyState
          icon="🗂️"
          title="No projects yet"
          description="Group related tasks into a project with milestones, members, and a Kanban board."
          action={
            <Button size="sm" onClick={() => setProjectModalOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> New project
            </Button>
          }
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((p) => {
          const pct = p.taskCount ? Math.round(((p.completedTaskCount ?? 0) / p.taskCount) * 100) : 0;
          return (
            <Link key={p.id} href={`/projects/${p.id}`} className="card-surface p-4 flex flex-col hover:border-accent/40 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color }} />
                <h3 className="text-sm font-semibold truncate">{p.name}</h3>
              </div>
              {p.description && <p className="text-xs text-muted line-clamp-2 mb-3">{p.description}</p>}
              <div className="mt-auto space-y-2">
                <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: p.color }} />
                </div>
                <div className="flex items-center justify-between text-[11px] text-muted">
                  <span>
                    {p.completedTaskCount ?? 0}/{p.taskCount ?? 0} tasks
                  </span>
                  <span className="flex items-center gap-2">
                    {!!p.members?.length && (
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3 w-3" /> {p.members.length}
                      </span>
                    )}
                    {p.deadline && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {new Date(p.deadline).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
