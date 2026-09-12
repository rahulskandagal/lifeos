import { db, newId, nowISO } from "@/lib/db/client";
import type { FocusSession } from "@/types";
import { logActivity } from "./activity";

export function startFocusSession(userId: string, input: { taskId?: string; mode?: string; plannedMinutes: number }): FocusSession {
  const id = newId("focus");
  const ts = nowISO();
  db.prepare(
    `INSERT INTO FocusSession (id, userId, taskId, mode, plannedMinutes, startedAt, completed, interrupted, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?)`
  ).run(id, userId, input.taskId ?? null, input.mode ?? "pomodoro", input.plannedMinutes, ts, ts);
  return db.prepare(`SELECT * FROM FocusSession WHERE id = ?`).get(id) as any;
}

export function endFocusSession(userId: string, id: string, input: { actualMinutes: number; completed: boolean; interrupted?: boolean }): FocusSession {
  db.prepare(`UPDATE FocusSession SET endedAt=?, actualMinutes=?, completed=?, interrupted=? WHERE id=? AND userId=?`).run(
    nowISO(),
    input.actualMinutes,
    input.completed ? 1 : 0,
    input.interrupted ? 1 : 0,
    id,
    userId
  );
  logActivity(userId, "focus", id, "completed", `${input.actualMinutes}min`);
  return db.prepare(`SELECT * FROM FocusSession WHERE id = ?`).get(id) as any;
}

export function listFocusSessions(userId: string, dateFrom?: string, dateTo?: string): FocusSession[] {
  if (dateFrom && dateTo) {
    return db
      .prepare(`SELECT * FROM FocusSession WHERE userId = ? AND startedAt >= ? AND startedAt <= ? ORDER BY startedAt DESC`)
      .all(userId, dateFrom, dateTo) as any[];
  }
  return db.prepare(`SELECT * FROM FocusSession WHERE userId = ? ORDER BY startedAt DESC LIMIT 200`).all(userId) as any[];
}

export function focusMinutesToday(userId: string): number {
  const today = new Date().toISOString().slice(0, 10);
  const rows = db.prepare(`SELECT actualMinutes FROM FocusSession WHERE userId = ? AND startedAt LIKE ?`).all(userId, `${today}%`) as any[];
  return rows.reduce((s, r) => s + (r.actualMinutes ?? 0), 0);
}
