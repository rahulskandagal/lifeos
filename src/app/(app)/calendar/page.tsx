"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/apiClient";
import { Button } from "@/components/ui/Button";
import { MonthView } from "@/components/calendar/MonthView";
import { WeekDayView } from "@/components/calendar/WeekDayView";
import { YearView } from "@/components/calendar/YearView";
import { useUIStore } from "@/lib/store/uiStore";
import { addDays, startOfMonth, startOfWeek, toISODate, endOfMonth, monthGrid } from "@/lib/utils/date";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { Task, CalendarEvent } from "@/types";

type ViewMode = "day" | "week" | "month" | "year";

export default function CalendarPage() {
  const [view, setView] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const openEventModal = useUIStore((s) => s.openEventModal);

  const range = useMemo(() => {
    if (view === "day") return { from: toISODate(currentDate), to: toISODate(currentDate) };
    if (view === "week") {
      const start = startOfWeek(currentDate);
      return { from: toISODate(start), to: toISODate(addDays(start, 6)) };
    }
    if (view === "year") return { from: `${currentDate.getFullYear()}-01-01`, to: `${currentDate.getFullYear()}-12-31` };
    const grid = monthGrid(currentDate);
    return { from: toISODate(grid[0]), to: toISODate(grid[grid.length - 1]) };
  }, [view, currentDate]);

  const { data: eventsData } = useSWR<{ events: CalendarEvent[] }>(`/api/calendar?from=${range.from}&to=${range.to}`, fetcher);
  const { data: tasksData } = useSWR<{ tasks: Task[] }>(`/api/tasks?dateFrom=${range.from}&dateTo=${range.to}`, fetcher);

  function navigate(dir: 1 | -1) {
    if (view === "day") setCurrentDate(addDays(currentDate, dir));
    else if (view === "week") setCurrentDate(addDays(currentDate, 7 * dir));
    else if (view === "year") setCurrentDate(new Date(currentDate.getFullYear() + dir, currentDate.getMonth(), 1));
    else setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + dir, 1));
  }

  const title = useMemo(() => {
    if (view === "day") return currentDate.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    if (view === "week") {
      const start = startOfWeek(currentDate);
      return `${start.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${addDays(start, 6).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
    }
    if (view === "year") return `${currentDate.getFullYear()}`;
    return currentDate.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  }, [view, currentDate]);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
        <Button onClick={() => openEventModal({ date: toISODate(currentDate) })}>
          <Plus className="h-4 w-4" /> New event
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="secondary" size="icon" onClick={() => navigate(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date())}>
            Today
          </Button>
          <h2 className="text-base font-semibold ml-2">{title}</h2>
        </div>
        <div className="flex rounded-lg border border-border p-0.5 bg-surface">
          {(["day", "week", "month", "year"] as ViewMode[]).map((v) => (
            <button key={v} onClick={() => setView(v)} className={cn("h-8 px-3 rounded-md text-xs font-medium capitalize", view === v ? "bg-accent/12 text-accent" : "text-muted")}>
              {v}
            </button>
          ))}
        </div>
      </div>

      {view === "month" && <MonthView currentDate={currentDate} tasks={tasksData?.tasks ?? []} events={eventsData?.events ?? []} />}
      {view === "week" && <WeekDayView days={Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(currentDate), i))} tasks={tasksData?.tasks ?? []} events={eventsData?.events ?? []} />}
      {view === "day" && <WeekDayView days={[currentDate]} tasks={tasksData?.tasks ?? []} events={eventsData?.events ?? []} />}
      {view === "year" && (
        <YearView
          year={currentDate.getFullYear()}
          tasks={tasksData?.tasks ?? []}
          events={eventsData?.events ?? []}
          onSelectMonth={(m) => {
            setCurrentDate(new Date(currentDate.getFullYear(), m, 1));
            setView("month");
          }}
        />
      )}
    </div>
  );
}
