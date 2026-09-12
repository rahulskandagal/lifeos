import type { Task, Habit, CalendarEvent, UserSettings } from "@/types";

export interface PlanBlock {
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  type: "task" | "habit" | "break" | "meal" | "fixed";
  title: string;
  taskId?: string;
  habitId?: string;
  icon?: string;
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}
function toHHMM(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

/**
 * Auto Day Planner — greedily schedules tasks into the user's available
 * window, respecting fixed calendar events, inserting short breaks every
 * ~90-120 minutes of work, placing high-energy/high-priority tasks in the
 * user's stated "productive hours", and slotting in daily habits.
 */
export function planDay(params: {
  tasks: Task[];
  habits: Habit[];
  fixedEvents: CalendarEvent[];
  settings: UserSettings;
}): PlanBlock[] {
  const { tasks, habits, fixedEvents, settings } = params;
  const dayStart = toMinutes(settings.workingHoursStart || "08:00");
  const dayEnd = toMinutes(settings.workingHoursEnd || "20:00");
  const productiveStart = toMinutes(settings.productiveHoursStart || "09:00");
  const productiveEnd = toMinutes(settings.productiveHoursEnd || "12:00");

  const blocks: PlanBlock[] = [];

  // 1. Place fixed calendar events first (immovable).
  const occupied: { start: number; end: number }[] = [];
  for (const ev of fixedEvents) {
    const start = toMinutes(ev.startTime);
    const end = toMinutes(ev.endTime);
    blocks.push({ startTime: ev.startTime, endTime: ev.endTime, type: "fixed", title: ev.title });
    occupied.push({ start, end });
  }

  // 2. Sort tasks: those already scheduled with a start time are fixed too;
  //    the rest get greedily placed, prioritizing critical/high priority
  //    and higher AI score into the productive-hours window first.
  const scheduledTasks = tasks.filter((t) => t.startTime);
  const unscheduledTasks = tasks.filter((t) => !t.startTime);

  for (const t of scheduledTasks) {
    const start = toMinutes(t.startTime!);
    const end = t.endTime ? toMinutes(t.endTime) : start + (t.estimatedMinutes ?? 30);
    blocks.push({ startTime: t.startTime!, endTime: toHHMM(end), type: "task", title: t.title, taskId: t.id });
    occupied.push({ start, end });
  }

  const priorityWeight: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  const sorted = [...unscheduledTasks].sort((a, b) => {
    const scoreA = a.aiPriorityScore ?? 0;
    const scoreB = b.aiPriorityScore ?? 0;
    if (scoreA !== scoreB) return scoreB - scoreA;
    return (priorityWeight[a.priority] ?? 2) - (priorityWeight[b.priority] ?? 2);
  });

  function findSlot(durationMin: number, preferStart: number, preferEnd: number): number | null {
    // try within preferred window first, then whole day
    for (const [lo, hi] of [
      [preferStart, preferEnd],
      [dayStart, dayEnd],
    ]) {
      let cursor = lo;
      const windowOccupied = occupied.filter((o) => o.start < hi && o.end > lo).sort((a, b) => a.start - b.start);
      for (const o of windowOccupied) {
        if (o.start - cursor >= durationMin) return cursor;
        cursor = Math.max(cursor, o.end);
      }
      if (hi - cursor >= durationMin) return cursor;
    }
    return null;
  }

  let minutesSinceBreak = 0;
  for (const task of sorted) {
    const duration = task.estimatedMinutes ?? 45;
    const preferHighEnergy = task.priority === "critical" || task.priority === "high" || task.energyLevel === "high";
    const slot = findSlot(duration, preferHighEnergy ? productiveStart : dayStart, preferHighEnergy ? productiveEnd : dayEnd);
    if (slot === null) continue; // no room today — AI would flag this as overloaded

    blocks.push({ startTime: toHHMM(slot), endTime: toHHMM(slot + duration), type: "task", title: task.title, taskId: task.id });
    occupied.push({ start: slot, end: slot + duration });
    minutesSinceBreak += duration;

    if (minutesSinceBreak >= 100) {
      const breakSlot = findSlot(15, slot + duration, slot + duration + 30);
      if (breakSlot !== null) {
        blocks.push({ startTime: toHHMM(breakSlot), endTime: toHHMM(breakSlot + 15), type: "break", title: "Break", icon: "☕" });
        occupied.push({ start: breakSlot, end: breakSlot + 15 });
      }
      minutesSinceBreak = 0;
    }
  }

  // 3. Slot in habits without logs today, into free gaps (short 15-30 min blocks)
  for (const habit of habits) {
    const hasLogToday = habit.logs?.some((l) => l.date === new Date().toISOString().slice(0, 10) && l.completed);
    if (hasLogToday) continue;
    const duration = 20;
    const slot = findSlot(duration, dayStart, dayEnd);
    if (slot !== null) {
      blocks.push({ startTime: toHHMM(slot), endTime: toHHMM(slot + duration), type: "habit", title: habit.name, habitId: habit.id, icon: habit.icon });
      occupied.push({ start: slot, end: slot + duration });
    }
  }

  blocks.sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));
  return blocks;
}

export function detectOverload(tasks: Task[], availableMinutes: number): { overloaded: boolean; totalMinutes: number; message?: string } {
  const totalMinutes = tasks.reduce((sum, t) => sum + (t.estimatedMinutes ?? 30), 0);
  if (totalMinutes > availableMinutes) {
    const totalHrs = (totalMinutes / 60).toFixed(1);
    const availHrs = (availableMinutes / 60).toFixed(1);
    return {
      overloaded: true,
      totalMinutes,
      message: `You scheduled ${totalHrs}h of work in a ${availHrs}h availability window. Consider rescheduling lower-priority tasks.`,
    };
  }
  return { overloaded: false, totalMinutes };
}
