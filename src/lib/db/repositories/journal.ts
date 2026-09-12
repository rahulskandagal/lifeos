import { db, newId, nowISO } from "@/lib/db/client";
import type { Journal } from "@/types";

export function getJournalByDate(userId: string, date: string): Journal | undefined {
  const row = db.prepare(`SELECT * FROM Journal WHERE userId = ? AND date = ?`).get(userId, date) as any;
  return row ?? undefined;
}

export function listJournal(userId: string, limit = 30): Journal[] {
  return db.prepare(`SELECT * FROM Journal WHERE userId = ? ORDER BY date DESC LIMIT ?`).all(userId, limit) as any[];
}

export function upsertJournal(
  userId: string,
  date: string,
  patch: Partial<Pick<Journal, "whatHappened" | "accomplishments" | "wentWell" | "wentWrong" | "improvements" | "tomorrowPriorities" | "mood" | "aiSummary">>
): Journal {
  const existing = getJournalByDate(userId, date);
  const ts = nowISO();
  if (existing) {
    const merged = { ...existing, ...patch };
    db.prepare(
      `UPDATE Journal SET whatHappened=?, accomplishments=?, wentWell=?, wentWrong=?, improvements=?, tomorrowPriorities=?, mood=?, aiSummary=?, updatedAt=? WHERE id=?`
    ).run(
      merged.whatHappened ?? null,
      merged.accomplishments ?? null,
      merged.wentWell ?? null,
      merged.wentWrong ?? null,
      merged.improvements ?? null,
      merged.tomorrowPriorities ?? null,
      merged.mood ?? null,
      merged.aiSummary ?? null,
      ts,
      existing.id
    );
    return getJournalByDate(userId, date)!;
  }
  const id = newId("journal");
  db.prepare(
    `INSERT INTO Journal (id, userId, date, whatHappened, accomplishments, wentWell, wentWrong, improvements, tomorrowPriorities, mood, aiSummary, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    userId,
    date,
    patch.whatHappened ?? null,
    patch.accomplishments ?? null,
    patch.wentWell ?? null,
    patch.wentWrong ?? null,
    patch.improvements ?? null,
    patch.tomorrowPriorities ?? null,
    patch.mood ?? null,
    patch.aiSummary ?? null,
    ts,
    ts
  );
  return getJournalByDate(userId, date)!;
}
