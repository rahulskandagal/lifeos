"use client";

import { monthGrid, isSameMonth, toISODate } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";
import type { Task, CalendarEvent } from "@/types";

export function YearView({ year, tasks, events, onSelectMonth }: { year: number; tasks: Task[]; events: CalendarEvent[]; onSelectMonth: (m: number) => void }) {
  const counts: Record<string, number> = {};
  for (const t of tasks) if (t.date) counts[t.date] = (counts[t.date] ?? 0) + 1;
  for (const e of events) counts[e.date] = (counts[e.date] ?? 0) + 1;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 12 }, (_, m) => {
        const monthDate = new Date(year, m, 1);
        const days = monthGrid(monthDate);
        return (
          <button key={m} onClick={() => onSelectMonth(m)} className="card-surface p-3 text-left hover:border-accent/40 transition-colors">
            <p className="text-sm font-semibold mb-2">{monthDate.toLocaleDateString(undefined, { month: "long" })}</p>
            <div className="grid grid-cols-7 gap-0.5">
              {days.map((d, i) => {
                const count = counts[toISODate(d)] ?? 0;
                const inMonth = isSameMonth(d, monthDate);
                return (
                  <div
                    key={i}
                    className={cn("h-3.5 w-3.5 rounded-sm", !inMonth && "opacity-20")}
                    style={{ background: count === 0 ? "var(--surface-2)" : `color-mix(in srgb, var(--accent) ${Math.min(100, count * 30)}%, var(--surface-2))` }}
                    title={toISODate(d)}
                  />
                );
              })}
            </div>
          </button>
        );
      })}
    </div>
  );
}
