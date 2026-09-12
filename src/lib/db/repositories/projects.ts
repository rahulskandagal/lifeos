import { db, newId, nowISO } from "@/lib/db/client";
import type { Project } from "@/types";
import { logActivity } from "./activity";

export function hydrateProject(project: Project): Project {
  project.members = db.prepare(`SELECT * FROM ProjectMember WHERE projectId = ?`).all(project.id) as any[];
  project.milestones = (db.prepare(`SELECT * FROM ProjectMilestone WHERE projectId = ? ORDER BY dueDate ASC`).all(project.id) as any[]).map((m) => ({
    ...m,
    completed: !!m.completed,
  }));
  const counts = db.prepare(`SELECT COUNT(*) as total, SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) as completed FROM Task WHERE projectId = ?`).get(project.id) as any;
  project.taskCount = counts.total ?? 0;
  project.completedTaskCount = counts.completed ?? 0;
  return project;
}

export function listProjects(userId: string): Project[] {
  const rows = db.prepare(`SELECT * FROM Project WHERE userId = ? ORDER BY createdAt DESC`).all(userId) as any[];
  return rows.map((r) => hydrateProject(r));
}

export function getProjectById(id: string): Project | undefined {
  const row = db.prepare(`SELECT * FROM Project WHERE id = ?`).get(id) as any;
  if (!row) return undefined;
  return hydrateProject(row);
}

export function createProject(userId: string, input: { name: string; description?: string; color?: string; deadline?: string; members?: string[]; milestones?: string[] }): Project {
  const id = newId("proj");
  const ts = nowISO();
  db.prepare(
    `INSERT INTO Project (id, userId, name, description, color, status, deadline, progress, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, 'active', ?, 0, ?, ?)`
  ).run(id, userId, input.name, input.description ?? null, input.color ?? "#3B82F6", input.deadline ?? null, ts, ts);

  if (input.members?.length) {
    const stmt = db.prepare(`INSERT INTO ProjectMember (id, projectId, name, role, createdAt) VALUES (?, ?, ?, 'member', ?)`);
    for (const name of input.members) stmt.run(newId("mem"), id, name, ts);
  }
  if (input.milestones?.length) {
    const stmt = db.prepare(`INSERT INTO ProjectMilestone (id, projectId, title, completed, createdAt) VALUES (?, ?, ?, 0, ?)`);
    for (const title of input.milestones) stmt.run(newId("pmile"), id, title, ts);
  }
  logActivity(userId, "project", id, "created", input.name);
  return getProjectById(id)!;
}

export function updateProject(userId: string, id: string, patch: Partial<{ name: string; description: string; color: string; status: string; deadline: string; progress: number }>): Project {
  const current = db.prepare(`SELECT * FROM Project WHERE id = ? AND userId = ?`).get(id, userId) as any;
  if (!current) throw new Error("Project not found");
  const merged = { ...current, ...patch };
  db.prepare(`UPDATE Project SET name=?, description=?, color=?, status=?, deadline=?, progress=?, updatedAt=? WHERE id=? AND userId=?`).run(
    merged.name,
    merged.description,
    merged.color,
    merged.status,
    merged.deadline,
    merged.progress,
    nowISO(),
    id,
    userId
  );
  return getProjectById(id)!;
}

export function deleteProject(userId: string, id: string) {
  db.prepare(`DELETE FROM Project WHERE id = ? AND userId = ?`).run(id, userId);
}
