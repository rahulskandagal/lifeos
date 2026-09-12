"use client";

import { DndContext, useDraggable, useDroppable, type DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { monthGrid, isSameDay, isSameMonth, toISODate } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";
import type { Task, CalendarEvent } from "@/types";
import { useUIStore } from "@/lib/store/uiStore";
import { apiMutate } from "@/lib/apiClient";
import { useSWRConfig } from "swr";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function MonthView({ currentDate, tasks, events }: { currentDate: Date; tasks: Task[]; events: CalendarEvent[] }) {
  const days = monthGrid(currentDate);
  const openTaskModal = useUIStore((s) => s.openTaskModal);
  const openEventModal = useUIStore((s) => s.openEventModal);
  const { mutate } = useSWRConfig();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const itemsByDate: Record<string, { type: "task" | "event"; item: Task | CalendarEvent }[]> = {};
  for (const t of tasks) {
    if (!t.date) continue;
    (itemsByDate[t.date] ??= []).push({ type: "task", item: t });
  }
  for (const e of events) {
    (itemsByDate[e.date] ??= []).push({ type: "event", item: e });
  }

  async function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over) return;
    const [type, id] = String(active.id).split(":");
    const newDate = String(over.id);
    if (type === "task") {
      await apiMutate(`/api/tasks/${id}`, "PATCH", { date: newDate });
      mutate((k) => typeof k === "string" && k.startsWith("/api/tasks"));
    } else {
      await apiMutate(`/api/calendar/${id}`, "PATCH", { date: newDate });
    }
    mutate((k) => typeof k === "string" && k.startsWith("/api/calendar"));
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-7 gap-px bg-border rounded-2xl overflow-hidden border border-border">
        {WEEKDAYS.map((d) => (
          <div key={d} className="bg-surface-2 text-center text-xs font-semibold text-muted py-2">
            {d}
          </div>
        ))}
        {days.map((day, idx) => {
          const dateStr = toISODate(day);
          const items = itemsByDate[dateStr] ?? [];
          const inMonth = isSameMonth(day, currentDate);
          const isToday = isSameDay(day, new Date());
          return (
            <DayCell key={idx} dateStr={dateStr}>
              <div
                className={cn("bg-surface min-h-[100px] p-1.5 flex flex-col gap-1 cursor-pointer", !inMonth && "opacity-40")}
                onClick={() => openEventModal({ date: dateStr })}
              >
                <span className={cn("text-xs font-medium h-5 w-5 flex items-center justify-center rounded-full", isToday && "bg-accent text-white")}>{day.getDate()}</span>
                <div className="flex-1 space-y-1 overflow-hidden">
                  {items.slice(0, 3).map((it, i) => (
                    <DraggableChip
                      key={i}
                      id={`${it.type}:${(it.item as any).id}`}
                      onClick={(ev) => {
                        ev.stopPropagation();
                        if (it.type === "task") openTaskModal({ task: it.item as Task });
                      }}
                      color={it.type === "event" ? (it.item as CalendarEvent).color : undefined}
                      priority={it.type === "task" ? (it.item as Task).priority : undefined}
                      label={it.item.title}
                    />
                  ))}
                  {items.length > 3 && <p className="text-[10px] text-muted px-1">+{items.length - 3} more</p>}
                </div>
              </div>
            </DayCell>
          );
        })}
      </div>
    </DndContext>
  );
}

function DayCell({ dateStr, children }: { dateStr: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: dateStr });
  return (
    <div ref={setNodeRef} className={cn(isOver && "ring-2 ring-accent/50 z-10 relative")}>
      {children}
    </div>
  );
}

const PRIORITY_COLORS: Record<string, string> = { critical: "#ef4444", high: "#f59e0b", medium: "#3b82f6", low: "#94a3b8" };

function DraggableChip({ id, label, color, priority, onClick }: { id: string; label: string; color?: string; priority?: string; onClick: (e: React.MouseEvent) => void }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 20 } : undefined;
  const bg = color ?? PRIORITY_COLORS[priority ?? "medium"];

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className="text-[10px] leading-tight rounded px-1.5 py-0.5 truncate cursor-grab active:cursor-grabbing text-white"
      title={label}
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full mr-1 align-middle" style={{ background: bg }} />
      <span className="text-foreground align-middle">{label}</span>
    </div>
  );
}
