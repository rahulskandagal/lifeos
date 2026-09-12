import { db, newId, nowISO } from "@/lib/db/client";
import type { CalendarEvent } from "@/types";

export function listEvents(userId: string, dateFrom: string, dateTo: string): CalendarEvent[] {
  const rows = db
    .prepare(`SELECT * FROM CalendarEvent WHERE userId = ? AND date BETWEEN ? AND ? ORDER BY startTime ASC`)
    .all(userId, dateFrom, dateTo) as any[];
  return rows.map((r) => ({ ...r, allDay: !!r.allDay }));
}

export function createEvent(
  userId: string,
  input: { title: string; description?: string; date: string; startTime: string; endTime: string; color?: string; location?: string; taskId?: string; allDay?: boolean; repeatRule?: string }
): CalendarEvent {
  const id = newId("evt");
  const ts = nowISO();
  db.prepare(
    `INSERT INTO CalendarEvent (id, userId, taskId, title, description, date, startTime, endTime, color, location, repeatRule, allDay, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    userId,
    input.taskId ?? null,
    input.title,
    input.description ?? null,
    input.date,
    input.startTime,
    input.endTime,
    input.color ?? "#7C3AED",
    input.location ?? null,
    input.repeatRule ?? null,
    input.allDay ? 1 : 0,
    ts,
    ts
  );
  return db.prepare(`SELECT * FROM CalendarEvent WHERE id = ?`).get(id) as any;
}

export function updateEvent(userId: string, id: string, patch: Partial<{ title: string; description: string; date: string; startTime: string; endTime: string; color: string; location: string }>): CalendarEvent {
  const current = db.prepare(`SELECT * FROM CalendarEvent WHERE id = ? AND userId = ?`).get(id, userId) as any;
  if (!current) throw new Error("Event not found");
  const merged = { ...current, ...patch };
  db.prepare(`UPDATE CalendarEvent SET title=?, description=?, date=?, startTime=?, endTime=?, color=?, location=?, updatedAt=? WHERE id=? AND userId=?`).run(
    merged.title,
    merged.description,
    merged.date,
    merged.startTime,
    merged.endTime,
    merged.color,
    merged.location,
    nowISO(),
    id,
    userId
  );
  return db.prepare(`SELECT * FROM CalendarEvent WHERE id = ?`).get(id) as any;
}

export function deleteEvent(userId: string, id: string) {
  db.prepare(`DELETE FROM CalendarEvent WHERE id = ? AND userId = ?`).run(id, userId);
}

export function detectConflicts(userId: string, date: string, startTime: string, endTime: string, excludeId?: string): CalendarEvent[] {
  const rows = db
    .prepare(
      `SELECT * FROM CalendarEvent WHERE userId = ? AND date = ? AND id != ? AND NOT (endTime <= ? OR startTime >= ?)`
    )
    .all(userId, date, excludeId ?? "", startTime, endTime) as any[];
  return rows.map((r) => ({ ...r, allDay: !!r.allDay }));
}
