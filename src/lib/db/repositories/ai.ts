import { db, newId, nowISO } from "@/lib/db/client";
import type { AIInteraction } from "@/types";

export function listAIInteractions(userId: string, limit = 100): AIInteraction[] {
  const rows = db.prepare(`SELECT * FROM AIInteraction WHERE userId = ? ORDER BY createdAt ASC LIMIT ?`).all(userId, limit) as any[];
  return rows;
}

export function addAIInteraction(userId: string, role: "user" | "assistant", content: string, actions?: unknown): AIInteraction {
  const id = newId("ai");
  const ts = nowISO();
  db.prepare(`INSERT INTO AIInteraction (id, userId, role, content, actionsJson, createdAt) VALUES (?, ?, ?, ?, ?, ?)`).run(
    id,
    userId,
    role,
    content,
    actions ? JSON.stringify(actions) : null,
    ts
  );
  return { id, userId, role, content, actionsJson: actions ? JSON.stringify(actions) : null, createdAt: ts };
}

export function clearAIHistory(userId: string) {
  db.prepare(`DELETE FROM AIInteraction WHERE userId = ?`).run(userId);
}
