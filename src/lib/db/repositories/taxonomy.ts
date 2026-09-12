import { db, newId, nowISO } from "@/lib/db/client";
import { DEFAULT_CATEGORIES, type Category, type Tag } from "@/types";

export function ensureDefaultCategories(userId: string) {
  const existing = db.prepare(`SELECT COUNT(*) as c FROM Category WHERE userId = ?`).get(userId) as any;
  if (existing.c > 0) return;
  const ts = nowISO();
  const stmt = db.prepare(
    `INSERT INTO Category (id, userId, name, icon, color, isDefault, createdAt) VALUES (?, ?, ?, ?, ?, 1, ?)`
  );
  for (const c of DEFAULT_CATEGORIES) {
    stmt.run(newId("cat"), userId, c.name, c.icon, c.color, ts);
  }
}

export function listCategories(userId: string): Category[] {
  const rows = db.prepare(`SELECT * FROM Category WHERE userId = ? ORDER BY isDefault DESC, name ASC`).all(userId) as any[];
  return rows.map((r) => ({ ...r, isDefault: !!r.isDefault }));
}

export function createCategory(userId: string, input: { name: string; icon?: string; color?: string }): Category {
  const id = newId("cat");
  const ts = nowISO();
  db.prepare(`INSERT INTO Category (id, userId, name, icon, color, isDefault, createdAt) VALUES (?, ?, ?, ?, ?, 0, ?)`).run(
    id,
    userId,
    input.name,
    input.icon ?? "📁",
    input.color ?? "#7C3AED",
    ts
  );
  return { id, userId, name: input.name, icon: input.icon ?? "📁", color: input.color ?? "#7C3AED", isDefault: false, createdAt: ts };
}

export function deleteCategory(userId: string, id: string) {
  db.prepare(`DELETE FROM Category WHERE id = ? AND userId = ?`).run(id, userId);
}

export function listTags(userId: string): Tag[] {
  return db.prepare(`SELECT * FROM Tag WHERE userId = ? ORDER BY name ASC`).all(userId) as any[];
}

export function findOrCreateTag(userId: string, name: string): Tag {
  const existing = db.prepare(`SELECT * FROM Tag WHERE userId = ? AND name = ?`).get(userId, name) as any;
  if (existing) return existing;
  const id = newId("tag");
  const ts = nowISO();
  db.prepare(`INSERT INTO Tag (id, userId, name, color, createdAt) VALUES (?, ?, ?, ?, ?)`).run(id, userId, name, "#64748B", ts);
  return { id, userId, name, color: "#64748B", createdAt: ts };
}

export function setTaskTags(taskId: string, tagIds: string[]) {
  db.prepare(`DELETE FROM TaskTag WHERE taskId = ?`).run(taskId);
  const stmt = db.prepare(`INSERT OR IGNORE INTO TaskTag (taskId, tagId) VALUES (?, ?)`);
  for (const tagId of tagIds) stmt.run(taskId, tagId);
}

export function getTaskTags(taskId: string): Tag[] {
  return db
    .prepare(`SELECT t.* FROM Tag t JOIN TaskTag tt ON tt.tagId = t.id WHERE tt.taskId = ?`)
    .all(taskId) as any[];
}
