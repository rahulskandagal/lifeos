"use client";

import { DndContext, DragOverlay, useDraggable, useDroppable, type DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { useState } from "react";
import type { Task, KanbanColumn } from "@/types";
import { PriorityBadge } from "@/components/ui/Badge";
import { useUIStore } from "@/lib/store/uiStore";
import { apiMutate } from "@/lib/apiClient";
import { useSWRConfig } from "swr";
import { cn } from "@/lib/utils/cn";

const COLUMNS: { key: KanbanColumn; label: string }[] = [
  { key: "backlog", label: "Backlog" },
  { key: "todo", label: "To Do" },
  { key: "in_progress", label: "In Progress" },
  { key: "review", label: "Review" },
  { key: "completed", label: "Completed" },
];

export function KanbanBoard({ tasks }: { tasks: Task[] }) {
  const { mutate } = useSWRConfig();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const byColumn: Record<string, Task[]> = {};
  for (const col of COLUMNS) byColumn[col.key] = [];
  for (const t of tasks) {
    (byColumn[t.kanbanColumn] ??= []).push(t);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;
    const taskId = active.id as string;
    const column = over.id as KanbanColumn;
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.kanbanColumn === column) return;
    await apiMutate(`/api/tasks/${taskId}/actions`, "POST", { action: "move-kanban", column });
    mutate((k) => typeof k === "string" && k.startsWith("/api/tasks"));
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={(e) => setActiveTask(tasks.find((t) => t.id === e.active.id) ?? null)}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => (
          <KanbanColumnView key={col.key} column={col.key} label={col.label} tasks={byColumn[col.key]} />
        ))}
      </div>
      <DragOverlay>{activeTask && <KanbanCard task={activeTask} dragging />}</DragOverlay>
    </DndContext>
  );
}

function KanbanColumnView({ column, label, tasks }: { column: KanbanColumn; label: string; tasks: Task[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: column });
  const openTaskModal = useUIStore((s) => s.openTaskModal);

  return (
    <div ref={setNodeRef} className={cn("w-72 shrink-0 rounded-2xl border border-border bg-surface-2/50 flex flex-col max-h-[calc(100vh-220px)]", isOver && "ring-2 ring-accent/50")}>
      <div className="px-3 py-3 flex items-center justify-between shrink-0">
        <span className="text-sm font-semibold">{label}</span>
        <span className="text-xs text-muted bg-surface rounded-full px-2 py-0.5">{tasks.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-2">
        {tasks.map((t) => (
          <KanbanCard key={t.id} task={t} />
        ))}
        <button
          onClick={() => openTaskModal({ initial: { kanbanColumn: column } as any })}
          className="w-full text-xs text-muted hover:text-accent hover:bg-surface rounded-lg py-2 transition-colors"
        >
          + Add task
        </button>
      </div>
    </div>
  );
}

function KanbanCard({ task, dragging }: { task: Task; dragging?: boolean }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: task.id });
  const openTaskModal = useUIStore((s) => s.openTaskModal);
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => !dragging && openTaskModal({ task })}
      className={cn("card-surface p-3 cursor-grab active:cursor-grabbing hover:border-accent/40 transition-colors", dragging && "shadow-2xl rotate-2")}
    >
      <p className="text-sm font-medium mb-2 line-clamp-2">{task.title}</p>
      <div className="flex items-center justify-between">
        <PriorityBadge priority={task.priority} />
        {task.date && <span className="text-[11px] text-muted">{new Date(task.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>}
      </div>
    </div>
  );
}
