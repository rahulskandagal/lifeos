import { NextResponse } from "next/server";
import { withAuth } from "@/lib/apiHandler";
import { TasksRepo, FocusRepo, HabitsRepo, GoalsRepo, GamificationRepo } from "@/lib/db/repositories";
import { db } from "@/lib/db/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withAuth(async (req, { userId }) => {
  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") ?? "30", 10);
  const today = new Date();
  const from = new Date(today.getTime() - days * 86400000).toISOString().slice(0, 10);
  const to = today.toISOString().slice(0, 10);

  const tasks = TasksRepo.listTasks(userId, { dateFrom: from, dateTo: to, topLevelOnly: false });
  const completed = tasks.filter((t) => t.status === "completed");
  const overdue = TasksRepo.listTasks(userId, { overdue: true });

  // Daily series
  const dailySeries: { date: string; completed: number; created: number; focusMinutes: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today.getTime() - i * 86400000).toISOString().slice(0, 10);
    const completedCount = (db.prepare(`SELECT COUNT(*) as c FROM Task WHERE userId=? AND date(completedAt)=? `).get(userId, date) as any).c;
    const createdCount = (db.prepare(`SELECT COUNT(*) as c FROM Task WHERE userId=? AND date(createdAt)=?`).get(userId, date) as any).c;
    const focusMinutes = (db.prepare(`SELECT COALESCE(SUM(actualMinutes),0) as m FROM FocusSession WHERE userId=? AND date(startedAt)=?`).get(userId, date) as any).m;
    dailySeries.push({ date, completed: completedCount, created: createdCount, focusMinutes });
  }

  // Category breakdown
  const categoryRows = db.prepare(`SELECT category, COUNT(*) as count FROM Task WHERE userId=? AND date BETWEEN ? AND ? AND category IS NOT NULL GROUP BY category`).all(userId, from, to) as any[];

  // Hour-of-day productivity (completed tasks by start hour)
  const hourRows = db.prepare(`SELECT substr(startTime,1,2) as hour, COUNT(*) as count FROM Task WHERE userId=? AND status='completed' AND startTime IS NOT NULL GROUP BY hour`).all(userId) as any[];

  // Day-of-week productivity
  const dowRows = db.prepare(`SELECT strftime('%w', date) as dow, COUNT(*) as count FROM Task WHERE userId=? AND status='completed' AND date IS NOT NULL GROUP BY dow`).all(userId) as any[];

  const habits = HabitsRepo.listHabits(userId);
  const goals = GoalsRepo.listGoals(userId);
  const focusSessions = FocusRepo.listFocusSessions(userId, from, new Date().toISOString());
  const totalFocusMinutes = focusSessions.reduce((s, f) => s + (f.actualMinutes ?? 0), 0);
  const gamification = GamificationRepo.getGamificationProfile(userId);

  return NextResponse.json({
    summary: {
      tasksCompleted: completed.length,
      tasksTotal: tasks.length,
      completionPct: tasks.length ? Math.round((completed.length / tasks.length) * 100) : 0,
      overdueCount: overdue.length,
      totalFocusMinutes,
      avgTaskMinutes: completed.length ? Math.round(completed.reduce((s, t) => s + (t.actualMinutes ?? t.estimatedMinutes ?? 0), 0) / completed.length) : 0,
      habitSuccessRate: habits.length ? Math.round(habits.reduce((s, h) => s + (h.successPct ?? 0), 0) / habits.length) : 0,
      avgGoalProgress: goals.length ? Math.round(goals.reduce((s, g) => s + g.progress, 0) / goals.length) : 0,
      currentStreak: gamification.currentStreak,
      bestStreak: gamification.bestStreak,
      level: gamification.level,
      xp: gamification.xp,
    },
    dailySeries,
    categoryBreakdown: categoryRows,
    hourProductivity: hourRows,
    dayOfWeekProductivity: dowRows,
  });
});
