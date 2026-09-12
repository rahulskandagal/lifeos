import { db, newId, nowISO } from "@/lib/db/client";
import type { User, UserSettings } from "@/types";

export function createUser(input: { name: string; email: string; passwordHash: string; timezone?: string }): User {
  const id = newId("user");
  const ts = nowISO();
  db.prepare(
    `INSERT INTO User (id, name, email, passwordHash, timezone, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(id, input.name, input.email, input.passwordHash, input.timezone ?? "UTC", ts, ts);

  db.prepare(
    `INSERT INTO UserSettings (id, userId, updatedAt) VALUES (?, ?, ?)`
  ).run(newId("settings"), id, ts);

  db.prepare(
    `INSERT INTO GamificationProfile (id, userId, updatedAt) VALUES (?, ?, ?)`
  ).run(newId("gam"), id, ts);

  return getUserById(id)!;
}

export function getUserByEmail(email: string): (User & { passwordHash: string }) | undefined {
  const row = db.prepare(`SELECT * FROM User WHERE email = ?`).get(email) as any;
  return row ?? undefined;
}

export function getUserById(id: string): User | undefined {
  const row = db.prepare(`SELECT * FROM User WHERE id = ?`).get(id) as any;
  return row ?? undefined;
}

export function updateUser(id: string, input: Partial<Pick<User, "name" | "avatarUrl" | "timezone">>): User {
  const current = getUserById(id);
  if (!current) throw new Error("User not found");
  db.prepare(
    `UPDATE User SET name = ?, avatarUrl = ?, timezone = ?, updatedAt = ? WHERE id = ?`
  ).run(
    input.name ?? current.name,
    input.avatarUrl ?? current.avatarUrl ?? null,
    input.timezone ?? current.timezone,
    nowISO(),
    id
  );
  return getUserById(id)!;
}

export function getUserSettings(userId: string): UserSettings {
  const row = db.prepare(`SELECT * FROM UserSettings WHERE userId = ?`).get(userId) as any;
  return {
    ...row,
    notifyTaskDue: !!row.notifyTaskDue,
    notifyHabit: !!row.notifyHabit,
    notifyGoalMilestone: !!row.notifyGoalMilestone,
    notifyMorningBriefing: !!row.notifyMorningBriefing,
    notifyEveningReview: !!row.notifyEveningReview,
    aiAutoPrioritize: !!row.aiAutoPrioritize,
    aiAutoBreakdown: !!row.aiAutoBreakdown,
    aiProactiveInsights: !!row.aiProactiveInsights,
  };
}

export function updateUserSettings(userId: string, patch: Partial<UserSettings>): UserSettings {
  const current = getUserSettings(userId);
  const merged = { ...current, ...patch };
  db.prepare(
    `UPDATE UserSettings SET theme=?, accentColor=?, language=?, workingHoursStart=?, workingHoursEnd=?,
     productiveHoursStart=?, productiveHoursEnd=?, dailyFocusGoalMinutes=?, dailyTaskGoal=?,
     notifyTaskDue=?, notifyHabit=?, notifyGoalMilestone=?, notifyMorningBriefing=?, notifyEveningReview=?,
     aiAutoPrioritize=?, aiAutoBreakdown=?, aiProactiveInsights=?, pomodoroFocusMin=?, pomodoroBreakMin=?,
     pomodoroLongBreakMin=?, weekStartsOn=?, updatedAt=? WHERE userId=?`
  ).run(
    merged.theme,
    merged.accentColor,
    merged.language,
    merged.workingHoursStart,
    merged.workingHoursEnd,
    merged.productiveHoursStart,
    merged.productiveHoursEnd,
    merged.dailyFocusGoalMinutes,
    merged.dailyTaskGoal,
    merged.notifyTaskDue ? 1 : 0,
    merged.notifyHabit ? 1 : 0,
    merged.notifyGoalMilestone ? 1 : 0,
    merged.notifyMorningBriefing ? 1 : 0,
    merged.notifyEveningReview ? 1 : 0,
    merged.aiAutoPrioritize ? 1 : 0,
    merged.aiAutoBreakdown ? 1 : 0,
    merged.aiProactiveInsights ? 1 : 0,
    merged.pomodoroFocusMin,
    merged.pomodoroBreakMin,
    merged.pomodoroLongBreakMin,
    merged.weekStartsOn,
    nowISO(),
    userId
  );
  return getUserSettings(userId);
}
