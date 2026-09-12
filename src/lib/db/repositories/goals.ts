import { db, newId, nowISO } from "@/lib/db/client";
import type { Goal, GoalMilestone, GoalTerm } from "@/types";
import { logActivity } from "./activity";

export function hydrateGoal(goal: Goal): Goal {
  const rows = db.prepare(`SELECT * FROM GoalMilestone WHERE goalId = ? ORDER BY orderIndex ASC, createdAt ASC`).all(goal.id) as any[];
  goal.milestones = rows.map((r) => ({ ...r, completed: !!r.completed }));
  return goal;
}

export function listGoals(userId: string, term?: GoalTerm): Goal[] {
  const rows = term
    ? (db.prepare(`SELECT * FROM Goal WHERE userId = ? AND term = ? ORDER BY createdAt DESC`).all(userId, term) as any[])
    : (db.prepare(`SELECT * FROM Goal WHERE userId = ? ORDER BY createdAt DESC`).all(userId) as any[]);
  return rows.map((r) => hydrateGoal(r));
}

export function getGoalById(id: string): Goal | undefined {
  const row = db.prepare(`SELECT * FROM Goal WHERE id = ?`).get(id) as any;
  if (!row) return undefined;
  return hydrateGoal(row);
}

export function createGoal(
  userId: string,
  input: { title: string; description?: string; term?: GoalTerm; category?: string; targetDate?: string; notes?: string; milestones?: string[] }
): Goal {
  const id = newId("goal");
  const ts = nowISO();
  db.prepare(
    `INSERT INTO Goal (id, userId, title, description, term, category, targetDate, progress, status, notes, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0, 'active', ?, ?, ?)`
  ).run(id, userId, input.title, input.description ?? null, input.term ?? "short", input.category ?? null, input.targetDate ?? null, input.notes ?? null, ts, ts);

  if (input.milestones?.length) {
    const stmt = db.prepare(`INSERT INTO GoalMilestone (id, goalId, title, completed, orderIndex, createdAt) VALUES (?, ?, ?, 0, ?, ?)`);
    input.milestones.forEach((title, idx) => stmt.run(newId("mile"), id, title, idx, ts));
  }
  logActivity(userId, "goal", id, "created", input.title);
  return getGoalById(id)!;
}

export function updateGoal(userId: string, id: string, patch: Partial<{ title: string; description: string; term: GoalTerm; category: string; targetDate: string; notes: string; status: string; progress: number }>): Goal {
  const current = db.prepare(`SELECT * FROM Goal WHERE id = ? AND userId = ?`).get(id, userId) as any;
  if (!current) throw new Error("Goal not found");
  const merged = { ...current, ...patch };
  db.prepare(
    `UPDATE Goal SET title=?, description=?, term=?, category=?, targetDate=?, notes=?, status=?, progress=?, updatedAt=? WHERE id=? AND userId=?`
  ).run(merged.title, merged.description, merged.term, merged.category, merged.targetDate, merged.notes, merged.status, merged.progress, nowISO(), id, userId);
  return getGoalById(id)!;
}

export function deleteGoal(userId: string, id: string) {
  db.prepare(`DELETE FROM Goal WHERE id = ? AND userId = ?`).run(id, userId);
}

export function addMilestone(goalId: string, title: string, dueDate?: string): Goal {
  const ts = nowISO();
  const count = (db.prepare(`SELECT COUNT(*) as c FROM GoalMilestone WHERE goalId = ?`).get(goalId) as any).c;
  db.prepare(`INSERT INTO GoalMilestone (id, goalId, title, completed, dueDate, orderIndex, createdAt) VALUES (?, ?, ?, 0, ?, ?, ?)`).run(
    newId("mile"),
    goalId,
    title,
    dueDate ?? null,
    count,
    ts
  );
  return getGoalById(goalId)!;
}

export function toggleMilestone(goalId: string, milestoneId: string): Goal {
  const m = db.prepare(`SELECT * FROM GoalMilestone WHERE id = ?`).get(milestoneId) as any;
  db.prepare(`UPDATE GoalMilestone SET completed = ? WHERE id = ?`).run(m.completed ? 0 : 1, milestoneId);
  recalcGoalProgress(goalId);
  return getGoalById(goalId)!;
}

export function recalcGoalProgress(goalId: string) {
  const rows = db.prepare(`SELECT completed FROM GoalMilestone WHERE goalId = ?`).all(goalId) as any[];
  if (!rows.length) return;
  const pct = Math.round((rows.filter((r) => r.completed).length / rows.length) * 100);
  db.prepare(`UPDATE Goal SET progress = ?, status = CASE WHEN ? = 100 THEN 'completed' ELSE status END, updatedAt = ? WHERE id = ?`).run(pct, pct, nowISO(), goalId);
}
