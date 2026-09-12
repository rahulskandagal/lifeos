import { db, newId, nowISO } from "@/lib/db/client";
import type { Habit, HabitLog } from "@/types";
import { logActivity } from "./activity";

function computeStreaks(logs: { date: string; completed: boolean }[]) {
  const completedDates = new Set(logs.filter((l) => l.completed).map((l) => l.date));
  let current = 0;
  const cursor = new Date();
  // count backward from today (allow today to be not-yet-done without breaking streak from yesterday)
  for (let i = 0; i < 3650; i++) {
    const dateStr = cursor.toISOString().slice(0, 10);
    if (completedDates.has(dateStr)) {
      current++;
      cursor.setDate(cursor.getDate() - 1);
    } else if (i === 0) {
      cursor.setDate(cursor.getDate() - 1);
      continue;
    } else {
      break;
    }
  }
  // best streak
  const sorted = [...completedDates].sort();
  let best = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const d of sorted) {
    const cur = new Date(d);
    if (prev) {
      const diff = (cur.getTime() - prev.getTime()) / 86400000;
      run = diff === 1 ? run + 1 : 1;
    } else {
      run = 1;
    }
    best = Math.max(best, run);
    prev = cur;
  }
  return { currentStreak: current, bestStreak: Math.max(best, current) };
}

export function listHabits(userId: string, includeArchived = false): Habit[] {
  const rows = db
    .prepare(`SELECT * FROM Habit WHERE userId = ? ${includeArchived ? "" : "AND archived = 0"} ORDER BY createdAt ASC`)
    .all(userId) as any[];
  return rows.map((r) => hydrateHabit({ ...r, archived: !!r.archived }));
}

export function hydrateHabit(habit: Habit): Habit {
  const logs = db.prepare(`SELECT * FROM HabitLog WHERE habitId = ? ORDER BY date DESC LIMIT 400`).all(habit.id) as any[];
  habit.logs = logs.map((l) => ({ ...l, completed: !!l.completed }));
  const { currentStreak, bestStreak } = computeStreaks(habit.logs);
  habit.currentStreak = currentStreak;
  habit.bestStreak = bestStreak;
  const last30 = habit.logs.filter((l) => {
    const d = new Date(l.date);
    return (Date.now() - d.getTime()) / 86400000 <= 30;
  });
  const completedLast30 = last30.filter((l) => l.completed).length;
  habit.successPct = last30.length ? Math.round((completedLast30 / 30) * 100) : 0;
  return habit;
}

export function getHabitById(id: string): Habit | undefined {
  const row = db.prepare(`SELECT * FROM Habit WHERE id = ?`).get(id) as any;
  if (!row) return undefined;
  return hydrateHabit({ ...row, archived: !!row.archived });
}

export function createHabit(
  userId: string,
  input: { name: string; icon?: string; color?: string; category?: string; frequency?: string; targetPerWeek?: number; reminderTime?: string; goalId?: string }
): Habit {
  const id = newId("habit");
  const ts = nowISO();
  db.prepare(
    `INSERT INTO Habit (id, userId, name, icon, color, category, frequency, targetPerWeek, reminderTime, goalId, archived, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`
  ).run(
    id,
    userId,
    input.name,
    input.icon ?? "✅",
    input.color ?? "#10B981",
    input.category ?? null,
    input.frequency ?? "daily",
    input.targetPerWeek ?? 7,
    input.reminderTime ?? null,
    input.goalId ?? null,
    ts,
    ts
  );
  logActivity(userId, "habit", id, "created", input.name);
  return getHabitById(id)!;
}

export function updateHabit(userId: string, id: string, patch: Partial<{ name: string; icon: string; color: string; category: string; frequency: string; targetPerWeek: number; reminderTime: string; archived: boolean }>): Habit {
  const current = db.prepare(`SELECT * FROM Habit WHERE id = ? AND userId = ?`).get(id, userId) as any;
  if (!current) throw new Error("Habit not found");
  const merged = { ...current, ...patch };
  db.prepare(
    `UPDATE Habit SET name=?, icon=?, color=?, category=?, frequency=?, targetPerWeek=?, reminderTime=?, archived=?, updatedAt=? WHERE id=? AND userId=?`
  ).run(merged.name, merged.icon, merged.color, merged.category, merged.frequency, merged.targetPerWeek, merged.reminderTime, merged.archived ? 1 : 0, nowISO(), id, userId);
  return getHabitById(id)!;
}

export function deleteHabit(userId: string, id: string) {
  db.prepare(`DELETE FROM Habit WHERE id = ? AND userId = ?`).run(id, userId);
}

export function toggleHabitLog(userId: string, habitId: string, date: string): Habit {
  const existing = db.prepare(`SELECT * FROM HabitLog WHERE habitId = ? AND date = ?`).get(habitId, date) as any;
  if (existing) {
    db.prepare(`DELETE FROM HabitLog WHERE id = ?`).run(existing.id);
  } else {
    db.prepare(`INSERT INTO HabitLog (id, habitId, date, completed, createdAt) VALUES (?, ?, ?, 1, ?)`).run(newId("hlog"), habitId, date, nowISO());
    logActivity(userId, "habit", habitId, "completed", date);
  }
  return getHabitById(habitId)!;
}

export function habitStatsOverall(userId: string) {
  const habits = listHabits(userId);
  const avgSuccess = habits.length ? Math.round(habits.reduce((s, h) => s + (h.successPct ?? 0), 0) / habits.length) : 0;
  const bestStreak = habits.reduce((m, h) => Math.max(m, h.bestStreak ?? 0), 0);
  return { totalHabits: habits.length, avgSuccess, bestStreak };
}
