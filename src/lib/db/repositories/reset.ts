import { db, nowISO } from "@/lib/db/client";

// One entry per erasable data category. Deletes rely on the foreign-key
// ON DELETE CASCADE / SET NULL rules already defined in schema.sql (e.g.
// deleting a Task cascades to its TaskTag/TaskDependency/Attachment rows),
// so each handler only needs to delete the "top" row for its domain.
export const RESET_SCOPES = [
  "tasks",
  "habits",
  "goals",
  "projects",
  "calendar",
  "notes",
  "journal",
  "focus",
  "notifications",
  "gamification",
  "ai",
] as const;

export type ResetScope = (typeof RESET_SCOPES)[number];

const SCOPE_LABELS: Record<ResetScope, string> = {
  tasks: "Tasks",
  habits: "Habits",
  goals: "Goals",
  projects: "Projects",
  calendar: "Calendar events",
  notes: "Notes",
  journal: "Journal entries",
  focus: "Focus session history",
  notifications: "Notifications",
  gamification: "XP, streaks & badges",
  ai: "AI chat history",
};

export function scopeLabel(scope: ResetScope): string {
  return SCOPE_LABELS[scope];
}

const HANDLERS: Record<ResetScope, (userId: string) => void> = {
  tasks: (userId) => {
    db.prepare(`DELETE FROM Task WHERE userId = ?`).run(userId);
  },
  habits: (userId) => {
    db.prepare(`DELETE FROM Habit WHERE userId = ?`).run(userId);
  },
  goals: (userId) => {
    db.prepare(`DELETE FROM Goal WHERE userId = ?`).run(userId);
  },
  projects: (userId) => {
    db.prepare(`DELETE FROM Project WHERE userId = ?`).run(userId);
  },
  calendar: (userId) => {
    db.prepare(`DELETE FROM CalendarEvent WHERE userId = ?`).run(userId);
    db.prepare(`DELETE FROM Reminder WHERE userId = ?`).run(userId);
  },
  notes: (userId) => {
    db.prepare(`DELETE FROM Note WHERE userId = ?`).run(userId);
  },
  journal: (userId) => {
    db.prepare(`DELETE FROM Journal WHERE userId = ?`).run(userId);
  },
  focus: (userId) => {
    db.prepare(`DELETE FROM FocusSession WHERE userId = ?`).run(userId);
  },
  notifications: (userId) => {
    db.prepare(`DELETE FROM Notification WHERE userId = ?`).run(userId);
  },
  gamification: (userId) => {
    db.prepare(`UPDATE GamificationProfile SET xp = 0, level = 1, currentStreak = 0, bestStreak = 0, lastActiveDate = NULL, updatedAt = ? WHERE userId = ?`).run(nowISO(), userId);
    db.prepare(`DELETE FROM Badge WHERE userId = ?`).run(userId);
    db.prepare(`DELETE FROM ProductivityScore WHERE userId = ?`).run(userId);
  },
  ai: (userId) => {
    db.prepare(`DELETE FROM AIInteraction WHERE userId = ?`).run(userId);
  },
};

function clearActivityLog(userId: string) {
  db.prepare(`DELETE FROM ActivityLog WHERE userId = ?`).run(userId);
}

function clearTaxonomy(userId: string) {
  // Keep the built-in default categories (e.g. "Personal", "Work") so the
  // account still has sensible categories to pick from after a full reset;
  // only remove user-created categories and tags.
  db.prepare(`DELETE FROM Category WHERE userId = ? AND isDefault = 0`).run(userId);
  db.prepare(`DELETE FROM Tag WHERE userId = ?`).run(userId);
}

export function isValidScope(value: string): value is ResetScope {
  return (RESET_SCOPES as readonly string[]).includes(value);
}

/**
 * Erase a user's own data, either everything ("all") or a specific list of
 * scopes. Never touches the User or UserSettings rows — the account itself
 * stays intact, only its content is wiped. Returns the scopes actually
 * cleared, for confirmation/toast messaging.
 */
export function resetUserData(userId: string, scope: "all" | ResetScope[]): ResetScope[] {
  const scopes: ResetScope[] = scope === "all" ? [...RESET_SCOPES] : scope.filter(isValidScope);

  for (const s of scopes) {
    HANDLERS[s](userId);
  }

  if (scope === "all") {
    clearActivityLog(userId);
    clearTaxonomy(userId);
  }

  return scopes;
}
