"use client";

import { addDays, isSameDay, toISODate } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";
import type { Task, CalendarEvent } from "@/types";
import { useUIStore } from "@/lib/store/uiStore";

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 6am - 10pm
const HOUR_HEIGHT = 56;

function timeToOffset(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h - 6) * HOUR_HEIGHT + (m / 60) * HOUR_HEIGHT;
}

const PRIORITY_COLORS: Record<string, string> = { critical: "#ef4444", high: "#f59e0b", medium: "#3b82f6", low: "#94a3b8" };

export function WeekDayView({ days, tasks, events }: { days: Date[]; tasks: Task[]; events: CalendarEvent[] }) {
  const openTaskModal = useUIStore((s) => s.openTaskModal);
  const openEventModal = useUIStore((s) => s.openEventModal);

  return (
    <div className="card-surface overflow-hidden">
      <div className="grid" style={{ gridTemplateColumns: `56px repeat(${days.length}, 1fr)` }}>
        <div />
        {days.map((day) => (
          <div key={day.toISOString()} className="text-center py-2 border-l border-border">
            <p className="text-xs text-muted">{day.toLocaleDateString(undefined, { weekday: "short" })}</p>
            <p className={cn("text-sm font-semibold h-7 w-7 mx-auto flex items-center justify-center rounded-full", isSameDay(day, new Date()) && "bg-accent text-white")}>
              {day.getDate()}
            </p>
          </div>
        ))}
      </div>
      <div className="grid overflow-y-auto max-h-[calc(100vh-280px)]" style={{ gridTemplateColumns: `56px repeat(${days.length}, 1fr)` }}>
        <div className="relative">
          {HOURS.map((h) => (
            <div key={h} style={{ height: HOUR_HEIGHT }} className="text-[10px] text-muted text-right pr-1.5 -mt-1.5">
              {h % 12 === 0 ? 12 : h % 12}
              {h < 12 ? "am" : "pm"}
            </div>
          ))}
        </div>
        {days.map((day) => {
          const dateStr = toISODate(day);
          const dayTasks = tasks.filter((t) => t.date === dateStr && t.startTime);
          const dayEvents = events.filter((e) => e.date === dateStr);
          return (
            <div
              key={dateStr}
              className="relative border-l border-border"
              style={{ height: HOURS.length * HOUR_HEIGHT }}
              onClick={(e) => {
                if (e.target === e.currentTarget) openEventModal({ date: dateStr, startTime: "09:00" });
              }}
            >
              {HOURS.map((h) => (
                <div key={h} className="border-t border-border/60" style={{ height: HOUR_HEIGHT }} />
              ))}
              {dayEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="absolute left-0.5 right-0.5 rounded-md px-1.5 py-0.5 text-[10px] text-white overflow-hidden cursor-pointer"
                  style={{ top: timeToOffset(ev.startTime), height: Math.max(20, timeToOffset(ev.endTime) - timeToOffset(ev.startTime)), background: ev.color }}
                >
                  {ev.title}
                </div>
              ))}
              {dayTasks.map((t) => (
                <div
                  key={t.id}
                  onClick={() => openTaskModal({ task: t })}
                  className="absolute left-0.5 right-0.5 rounded-md px-1.5 py-0.5 text-[10px] text-white overflow-hidden cursor-pointer opacity-90"
                  style={{
                    top: timeToOffset(t.startTime!),
                    height: Math.max(20, (t.estimatedMinutes ?? 30) / 60 * HOUR_HEIGHT),
                    background: PRIORITY_COLORS[t.priority],
                  }}
                >
                  {t.title}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
