import { db, newId, nowISO } from "@/lib/db/client";
import type { ActivityLog } from "@/types";

export function logActivity(userId: string, entityType: string, entityId: string | undefined, action: string, detail?: string) {
  db.prepare(
    `INSERT INTO ActivityLog (id, userId, entityType, entityId, action, detail, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(newId("act"), userId, entityType, entityId ?? null, action, detail ?? null, nowISO());
}

export function listActivity(userId: string, limit = 50): ActivityLog[] {
  return db.prepare(`SELECT * FROM ActivityLog WHERE userId = ? ORDER BY createdAt DESC LIMIT ?`).all(userId, limit) as any[];
}
