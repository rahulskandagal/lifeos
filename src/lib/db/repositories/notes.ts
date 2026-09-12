import { db, newId, nowISO } from "@/lib/db/client";
import type { Note } from "@/types";

export function listNotes(userId: string, opts: { search?: string; pinned?: boolean; favorite?: boolean } = {}): Note[] {
  const clauses = ["userId = ?"];
  const params: any[] = [userId];
  if (opts.search) {
    clauses.push("(title LIKE ? OR content LIKE ?)");
    params.push(`%${opts.search}%`, `%${opts.search}%`);
  }
  if (opts.pinned) clauses.push("pinned = 1");
  if (opts.favorite) clauses.push("favorite = 1");
  const rows = db.prepare(`SELECT * FROM Note WHERE ${clauses.join(" AND ")} ORDER BY pinned DESC, updatedAt DESC`).all(...params) as any[];
  return rows.map((r) => ({ ...r, pinned: !!r.pinned, favorite: !!r.favorite }));
}

export function getNoteById(id: string): Note | undefined {
  const row = db.prepare(`SELECT * FROM Note WHERE id = ?`).get(id) as any;
  if (!row) return undefined;
  return { ...row, pinned: !!row.pinned, favorite: !!row.favorite };
}

export function createNote(userId: string, input: { title: string; content?: string; type?: string; taskId?: string; projectId?: string; goalId?: string; color?: string }): Note {
  const id = newId("note");
  const ts = nowISO();
  db.prepare(
    `INSERT INTO Note (id, userId, title, content, type, taskId, projectId, goalId, pinned, favorite, color, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?)`
  ).run(id, userId, input.title, input.content ?? "", input.type ?? "note", input.taskId ?? null, input.projectId ?? null, input.goalId ?? null, input.color ?? "#FFFFFF", ts, ts);
  return getNoteById(id)!;
}

export function updateNote(userId: string, id: string, patch: Partial<{ title: string; content: string; pinned: boolean; favorite: boolean; color: string }>): Note {
  const current = db.prepare(`SELECT * FROM Note WHERE id = ? AND userId = ?`).get(id, userId) as any;
  if (!current) throw new Error("Note not found");
  const merged = { ...current, ...patch };
  db.prepare(`UPDATE Note SET title=?, content=?, pinned=?, favorite=?, color=?, updatedAt=? WHERE id=? AND userId=?`).run(
    merged.title,
    merged.content,
    merged.pinned ? 1 : 0,
    merged.favorite ? 1 : 0,
    merged.color,
    nowISO(),
    id,
    userId
  );
  return getNoteById(id)!;
}

export function deleteNote(userId: string, id: string) {
  db.prepare(`DELETE FROM Note WHERE id = ? AND userId = ?`).run(id, userId);
}
