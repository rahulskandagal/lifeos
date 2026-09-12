import { db, newId, nowISO } from "@/lib/db/client";
import type { GamificationProfile, Badge, ProductivityScore } from "@/types";
import { logActivity } from "./activity";

const BADGE_DEFS: { key: string; title: string; description: string; icon: string; check: (ctx: BadgeContext) => boolean }[] = [
  { key: "streak_7", title: "7 Day Streak", description: "Stayed active 7 days in a row", icon: "🔥", check: (c) => c.currentStreak >= 7 },
  { key: "streak_30", title: "30 Day Streak", description: "Stayed active 30 days in a row", icon: "🔥", check: (c) => c.currentStreak >= 30 },
  { key: "tasks_100", title: "100 Tasks Completed", description: "Completed 100 tasks", icon: "🏆", check: (c) => c.totalTasksCompleted >= 100 },
  { key: "tasks_500", title: "500 Tasks Completed", description: "Completed 500 tasks", icon: "🏆", check: (c) => c.totalTasksCompleted >= 500 },
  { key: "focus_10", title: "10 Focus Sessions", description: "Completed 10 focus sessions", icon: "⚡", check: (c) => c.totalFocusSessions >= 10 },
  { key: "focus_50", title: "50 Focus Sessions", description: "Completed 50 focus sessions", icon: "⚡", check: (c) => c.totalFocusSessions >= 50 },
  { key: "goal_master", title: "Goal Master", description: "Completed a goal", icon: "🎯", check: (c) => c.goalsCompleted >= 1 },
];

interface BadgeContext {
  currentStreak: number;
  totalTasksCompleted: number;
  totalFocusSessions: number;
  goalsCompleted: number;
}

export function getGamificationProfile(userId: string): GamificationProfile {
  const row = db.prepare(`SELECT * FROM GamificationProfile WHERE userId = ?`).get(userId) as any;
  return row;
}

export function addXP(userId: string, amount: number) {
  const profile = getGamificationProfile(userId);
  const newXp = profile.xp + amount;
  const newLevel = Math.floor(newXp / 500) + 1;
  db.prepare(`UPDATE GamificationProfile SET xp=?, level=?, updatedAt=? WHERE userId=?`).run(newXp, newLevel, nowISO(), userId);
}

export function touchActivityStreak(userId: string) {
  const profile = getGamificationProfile(userId);
  const today = new Date().toISOString().slice(0, 10);
  if (profile.lastActiveDate === today) return;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const newStreak = profile.lastActiveDate === yesterday ? profile.currentStreak + 1 : 1;
  const bestStreak = Math.max(profile.bestStreak, newStreak);
  db.prepare(`UPDATE GamificationProfile SET currentStreak=?, bestStreak=?, lastActiveDate=?, updatedAt=? WHERE userId=?`).run(newStreak, bestStreak, today, nowISO(), userId);
}

export function checkAndAwardBadges(userId: string): Badge[] {
  const profile = getGamificationProfile(userId);
  const totalTasksCompleted = (db.prepare(`SELECT COUNT(*) as c FROM Task WHERE userId = ? AND status = 'completed'`).get(userId) as any).c;
  const totalFocusSessions = (db.prepare(`SELECT COUNT(*) as c FROM FocusSession WHERE userId = ? AND completed = 1`).get(userId) as any).c;
  const goalsCompleted = (db.prepare(`SELECT COUNT(*) as c FROM Goal WHERE userId = ? AND status = 'completed'`).get(userId) as any).c;

  const ctx: BadgeContext = { currentStreak: profile.currentStreak, totalTasksCompleted, totalFocusSessions, goalsCompleted };
  const existing = new Set((db.prepare(`SELECT key FROM Badge WHERE userId = ?`).all(userId) as any[]).map((b) => b.key));
  const newlyAwarded: Badge[] = [];

  for (const def of BADGE_DEFS) {
    if (!existing.has(def.key) && def.check(ctx)) {
      const id = newId("badge");
      const ts = nowISO();
      db.prepare(`INSERT INTO Badge (id, userId, key, title, description, icon, earnedAt) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(id, userId, def.key, def.title, def.description, def.icon, ts);
      newlyAwarded.push({ id, userId, key: def.key, title: def.title, description: def.description, icon: def.icon, earnedAt: ts });
    }
  }
  return newlyAwarded;
}

export function listBadges(userId: string): Badge[] {
  return db.prepare(`SELECT * FROM Badge WHERE userId = ? ORDER BY earnedAt DESC`).all(userId) as any[];
}

export function getProductivityScore(userId: string, date: string): ProductivityScore | undefined {
  return db.prepare(`SELECT * FROM ProductivityScore WHERE userId = ? AND date = ?`).get(userId, date) as any;
}

export function upsertProductivityScore(userId: string, date: string, data: Omit<ProductivityScore, "id" | "userId" | "date" | "createdAt">): ProductivityScore {
  const existing = getProductivityScore(userId, date);
  if (existing) {
    db.prepare(`UPDATE ProductivityScore SET score=?, taskCompletionPct=?, focusPct=?, habitPct=?, goalPct=?, consistencyPct=?, breakdown=? WHERE id=?`).run(
      data.score,
      data.taskCompletionPct,
      data.focusPct,
      data.habitPct,
      data.goalPct,
      data.consistencyPct,
      data.breakdown ?? null,
      existing.id
    );
    return getProductivityScore(userId, date)!;
  }
  const id = newId("score");
  db.prepare(
    `INSERT INTO ProductivityScore (id, userId, date, score, taskCompletionPct, focusPct, habitPct, goalPct, consistencyPct, breakdown, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, userId, date, data.score, data.taskCompletionPct, data.focusPct, data.habitPct, data.goalPct, data.consistencyPct, data.breakdown ?? null, nowISO());
  return getProductivityScore(userId, date)!;
}

export function listProductivityScores(userId: string, days = 30): ProductivityScore[] {
  return db.prepare(`SELECT * FROM ProductivityScore WHERE userId = ? ORDER BY date DESC LIMIT ?`).all(userId, days) as any[];
}
