import { db, newId, nowISO } from "@/lib/db/client";
import type { Task, KanbanColumn, Priority, TaskStatus } from "@/types";
import { getTaskTags, setTaskTags, findOrCreateTag } from "./taxonomy";
import { logActivity } from "./activity";

export interface TaskFilters {
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: TaskStatus | TaskStatus[];
  priority?: Priority | Priority[];
  category?: string;
  projectId?: string;
  tag?: string;
  search?: string;
  overdue?: boolean;
  topLevelOnly?: boolean;
  completed?: boolean;
}

function rowToTask(row: any): Task {
  return {
    ...row,
    postponeCount: row.postponeCount ?? 0,
  };
}

export function hydrateTask(task: Task, opts: { withSubtasks?: boolean } = { withSubtasks: true }): Task {
  task.tags = getTaskTags(task.id);
  const deps = db.prepare(`SELECT dependsOnTaskId FROM TaskDependency WHERE taskId = ?`).all(task.id) as any[];
  task.dependsOn = deps.map((d) => d.dependsOnTaskId);
  if (opts.withSubtasks) {
    const subRows = db.prepare(`SELECT * FROM Task WHERE parentTaskId = ? ORDER BY createdAt ASC`).all(task.id) as any[];
    task.subtasks = subRows.map((r) => hydrateTask(rowToTask(r), { withSubtasks: false }));
  }
  task.attachments = db.prepare(`SELECT * FROM Attachment WHERE taskId = ?`).all(task.id) as any[];
  return task;
}

export function getTaskById(id: string): Task | undefined {
  const row = db.prepare(`SELECT * FROM Task WHERE id = ?`).get(id) as any;
  if (!row) return undefined;
  return hydrateTask(rowToTask(row));
}

export function listTasks(userId: string, filters: TaskFilters = {}): Task[] {
  const clauses = ["userId = ?"];
  const params: any[] = [userId];

  if (filters.topLevelOnly !== false) {
    clauses.push("parentTaskId IS NULL");
  }
  if (filters.date) {
    clauses.push("date = ?");
    params.push(filters.date);
  }
  if (filters.dateFrom) {
    clauses.push("date >= ?");
    params.push(filters.dateFrom);
  }
  if (filters.dateTo) {
    clauses.push("date <= ?");
    params.push(filters.dateTo);
  }
  if (filters.status) {
    const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
    clauses.push(`status IN (${statuses.map(() => "?").join(",")})`);
    params.push(...statuses);
  }
  if (filters.priority) {
    const priorities = Array.isArray(filters.priority) ? filters.priority : [filters.priority];
    clauses.push(`priority IN (${priorities.map(() => "?").join(",")})`);
    params.push(...priorities);
  }
  if (filters.category) {
    clauses.push("category = ?");
    params.push(filters.category);
  }
  if (filters.projectId) {
    clauses.push("projectId = ?");
    params.push(filters.projectId);
  }
  if (filters.search) {
    clauses.push("(title LIKE ? OR description LIKE ?)");
    params.push(`%${filters.search}%`, `%${filters.search}%`);
  }
  if (filters.overdue) {
    clauses.push("date < ? AND status != 'completed'");
    params.push(new Date().toISOString().slice(0, 10));
  }
  if (filters.completed !== undefined) {
    clauses.push(filters.completed ? "status = 'completed'" : "status != 'completed'");
  }

  const sql = `SELECT * FROM Task WHERE ${clauses.join(" AND ")} ORDER BY
    CASE priority WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
    date ASC, startTime ASC, createdAt DESC`;
  const rows = db.prepare(sql).all(...params) as any[];
  let tasks = rows.map((r) => hydrateTask(rowToTask(r)));

  if (filters.tag) {
    tasks = tasks.filter((t) => t.tags?.some((tg) => tg.name.toLowerCase() === filters.tag!.toLowerCase()));
  }
  return tasks;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  projectId?: string | null;
  parentTaskId?: string | null;
  priority?: Priority;
  aiPriorityScore?: number;
  category?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  estimatedMinutes?: number;
  location?: string;
  reminderMinutesBefore?: number;
  repeatRule?: string;
  notes?: string;
  energyLevel?: string;
  tags?: string[];
  status?: TaskStatus;
  kanbanColumn?: KanbanColumn;
  dependsOn?: string[];
}

export function createTask(userId: string, input: CreateTaskInput): Task {
  const id = newId("task");
  const ts = nowISO();
  db.prepare(
    `INSERT INTO Task (id, userId, projectId, parentTaskId, title, description, status, kanbanColumn, priority,
      aiPriorityScore, category, date, startTime, endTime, estimatedMinutes, location, reminderMinutesBefore,
      repeatRule, notes, energyLevel, postponeCount, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`
  ).run(
    id,
    userId,
    input.projectId ?? null,
    input.parentTaskId ?? null,
    input.title,
    input.description ?? null,
    input.status ?? "todo",
    input.kanbanColumn ?? "todo",
    input.priority ?? "medium",
    input.aiPriorityScore ?? null,
    input.category ?? null,
    input.date ?? null,
    input.startTime ?? null,
    input.endTime ?? null,
    input.estimatedMinutes ?? null,
    input.location ?? null,
    input.reminderMinutesBefore ?? null,
    input.repeatRule ?? null,
    input.notes ?? null,
    input.energyLevel ?? null,
    ts,
    ts
  );

  if (input.tags?.length) {
    const tagIds = input.tags.map((name) => findOrCreateTag(userId, name).id);
    setTaskTags(id, tagIds);
  }
  if (input.dependsOn?.length) {
    const stmt = db.prepare(`INSERT OR IGNORE INTO TaskDependency (id, taskId, dependsOnTaskId, createdAt) VALUES (?, ?, ?, ?)`);
    for (const dep of input.dependsOn) stmt.run(newId("dep"), id, dep, ts);
  }

  logActivity(userId, "task", id, "created", input.title);
  return getTaskById(id)!;
}

export function updateTask(userId: string, id: string, patch: Partial<CreateTaskInput & { status: TaskStatus; kanbanColumn: KanbanColumn }>): Task {
  const current = db.prepare(`SELECT * FROM Task WHERE id = ? AND userId = ?`).get(id, userId) as any;
  if (!current) throw new Error("Task not found");
  const merged = { ...current, ...patch };
  db.prepare(
    `UPDATE Task SET projectId=?, parentTaskId=?, title=?, description=?, status=?, kanbanColumn=?, priority=?,
     aiPriorityScore=?, category=?, date=?, startTime=?, endTime=?, estimatedMinutes=?, actualMinutes=?, location=?,
     reminderMinutesBefore=?, repeatRule=?, notes=?, energyLevel=?, postponeCount=?, completedAt=?, updatedAt=?
     WHERE id = ? AND userId = ?`
  ).run(
    merged.projectId ?? null,
    merged.parentTaskId ?? null,
    merged.title,
    merged.description ?? null,
    merged.status,
    merged.kanbanColumn,
    merged.priority,
    merged.aiPriorityScore ?? null,
    merged.category ?? null,
    merged.date ?? null,
    merged.startTime ?? null,
    merged.endTime ?? null,
    merged.estimatedMinutes ?? null,
    merged.actualMinutes ?? null,
    merged.location ?? null,
    merged.reminderMinutesBefore ?? null,
    merged.repeatRule ?? null,
    merged.notes ?? null,
    merged.energyLevel ?? null,
    merged.postponeCount ?? 0,
    merged.completedAt ?? null,
    nowISO(),
    id,
    userId
  );

  if (patch.tags) {
    const tagIds = patch.tags.map((name) => findOrCreateTag(userId, name).id);
    setTaskTags(id, tagIds);
  }

  logActivity(userId, "task", id, "updated", merged.title);
  return getTaskById(id)!;
}

export function completeTask(userId: string, id: string, actualMinutes?: number): Task {
  const ts = nowISO();
  db.prepare(`UPDATE Task SET status='completed', kanbanColumn='completed', completedAt=?, actualMinutes=COALESCE(?, actualMinutes), updatedAt=? WHERE id=? AND userId=?`).run(
    ts,
    actualMinutes ?? null,
    ts,
    id,
    userId
  );
  logActivity(userId, "task", id, "completed");
  return getTaskById(id)!;
}

export function uncompleteTask(userId: string, id: string): Task {
  db.prepare(`UPDATE Task SET status='todo', kanbanColumn='todo', completedAt=NULL, updatedAt=? WHERE id=? AND userId=?`).run(nowISO(), id, userId);
  return getTaskById(id)!;
}

export function deleteTask(userId: string, id: string) {
  db.prepare(`DELETE FROM Task WHERE id = ? AND userId = ?`).run(id, userId);
  logActivity(userId, "task", id, "deleted");
}

export function duplicateTask(userId: string, id: string): Task {
  const original = getTaskById(id);
  if (!original) throw new Error("Task not found");
  return createTask(userId, {
    title: `${original.title} (copy)`,
    description: original.description ?? undefined,
    projectId: original.projectId,
    priority: original.priority,
    category: original.category ?? undefined,
    date: original.date ?? undefined,
    startTime: original.startTime ?? undefined,
    endTime: original.endTime ?? undefined,
    estimatedMinutes: original.estimatedMinutes ?? undefined,
    location: original.location ?? undefined,
    reminderMinutesBefore: original.reminderMinutesBefore ?? undefined,
    notes: original.notes ?? undefined,
    tags: original.tags?.map((t) => t.name),
  });
}

export function snoozeTask(userId: string, id: string, newDate: string, newStartTime?: string): Task {
  const current = db.prepare(`SELECT postponeCount FROM Task WHERE id=?`).get(id) as any;
  db.prepare(`UPDATE Task SET date=?, startTime=COALESCE(?, startTime), postponeCount=?, updatedAt=? WHERE id=? AND userId=?`).run(
    newDate,
    newStartTime ?? null,
    (current?.postponeCount ?? 0) + 1,
    nowISO(),
    id,
    userId
  );
  logActivity(userId, "task", id, "rescheduled", newDate);
  return getTaskById(id)!;
}

export function addSubtask(userId: string, parentId: string, title: string): Task {
  return createTask(userId, { title, parentTaskId: parentId, status: "todo" });
}

export function moveKanban(userId: string, id: string, column: KanbanColumn): Task {
  const statusMap: Record<KanbanColumn, TaskStatus> = {
    backlog: "todo",
    todo: "todo",
    in_progress: "in_progress",
    review: "review",
    completed: "completed",
  };
  db.prepare(`UPDATE Task SET kanbanColumn=?, status=?, completedAt=?, updatedAt=? WHERE id=? AND userId=?`).run(
    column,
    statusMap[column],
    column === "completed" ? nowISO() : null,
    nowISO(),
    id,
    userId
  );
  return getTaskById(id)!;
}

export function taskStats(userId: string, dateFrom: string, dateTo: string) {
  const row = db
    .prepare(
      `SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status!='completed' AND date < ? THEN 1 ELSE 0 END) as overdue
       FROM Task WHERE userId = ? AND date BETWEEN ? AND ? AND parentTaskId IS NULL`
    )
    .get(new Date().toISOString().slice(0, 10), userId, dateFrom, dateTo) as any;
  return { total: row.total ?? 0, completed: row.completed ?? 0, overdue: row.overdue ?? 0 };
}
