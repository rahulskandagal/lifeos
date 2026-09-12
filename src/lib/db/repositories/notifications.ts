import { db, newId, nowISO } from "@/lib/db/client";
import type { Notification } from "@/types";

export function listNotifications(userId: string, unreadOnly = false): Notification[] {
  const rows = db
    .prepare(`SELECT * FROM Notification WHERE userId = ? ${unreadOnly ? "AND read = 0" : ""} ORDER BY createdAt DESC LIMIT 100`)
    .all(userId) as any[];
  return rows.map((r) => ({ ...r, read: !!r.read }));
}

export function createNotification(userId: string, input: { type: string; title: string; message?: string; icon?: string; link?: string }): Notification {
  const id = newId("notif");
  const ts = nowISO();
  db.prepare(`INSERT INTO Notification (id, userId, type, title, message, icon, link, read, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`).run(
    id,
    userId,
    input.type,
    input.title,
    input.message ?? null,
    input.icon ?? "🔔",
    input.link ?? null,
    ts
  );
  return { id, userId, type: input.type, title: input.title, message: input.message ?? null, icon: input.icon ?? "🔔", link: input.link ?? null, read: false, createdAt: ts };
}

export function markNotificationRead(userId: string, id: string) {
  db.prepare(`UPDATE Notification SET read = 1 WHERE id = ? AND userId = ?`).run(id, userId);
}

export function markAllNotificationsRead(userId: string) {
  db.prepare(`UPDATE Notification SET read = 1 WHERE userId = ?`).run(userId);
}

export function unreadCount(userId: string): number {
  return (db.prepare(`SELECT COUNT(*) as c FROM Notification WHERE userId = ? AND read = 0`).get(userId) as any).c;
}
