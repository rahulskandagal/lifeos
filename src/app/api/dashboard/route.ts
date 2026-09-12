import { NextResponse } from "next/server";
import { withAuth } from "@/lib/apiHandler";
import { TasksRepo, HabitsRepo, GoalsRepo, FocusRepo, GamificationRepo, UsersRepo, NotificationsRepo } from "@/lib/db/repositories";
import { computeProductivityScore } from "@/lib/ai/productivityScore";
import { generateInsights } from "@/lib/ai/insights";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withAuth(async (_req, { userId }) => {
  const today = new Date().toISOString().slice(0, 10);
  const todayTasks = TasksRepo.listTasks(userId, { date: today });
  const completedToday = todayTasks.filter((t) => t.status === "completed");
  const habits = HabitsRepo.listHabits(userId);
  const habitsToday = habits.filter((h) => h.frequency !== "weekly");
  const habitsCompletedToday = habitsToday.filter((h) => h.logs?.some((l) => l.date === today && l.completed)).length;
  const goals = GoalsRepo.listGoals(userId).filter((g) => g.status === "active");
  const focusMinutesToday = FocusRepo.focusMinutesToday(userId);
  const settings = UsersRepo.getUserSettings(userId);
  const gamification = GamificationRepo.getGamificationProfile(userId);
  const overdue = TasksRepo.listTasks(userId, { overdue: true });

  const avgGoalProgress = goals.length ? goals.reduce((s, g) => s + g.progress, 0) / goals.length : 0;

  const scoreResult = computeProductivityScore({
    tasksCompleted: completedToday.length,
    tasksPlanned: todayTasks.length,
    focusMinutes: focusMinutesToday,
    focusGoalMinutes: settings.dailyFocusGoalMinutes,
    habitsCompleted: habitsCompletedToday,
    habitsPlanned: habitsToday.length,
    goalsProgressDelta: avgGoalProgress,
    currentStreak: gamification.currentStreak,
  });

  const from = new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10);
  const recentTasks = TasksRepo.listTasks(userId, { dateFrom: from, dateTo: today });
  const focusSessions = FocusRepo.listFocusSessions(userId, from, new Date().toISOString());
  const insights = generateInsights({
    completedTasks: recentTasks.filter((t) => t.status === "completed"),
    allRecentTasks: recentTasks,
    focusSessions,
    habits,
    goals: GoalsRepo.listGoals(userId),
  });

  const notifications = NotificationsRepo.listNotifications(userId).slice(0, 5);

  return NextResponse.json({
    todayTasks,
    completedTodayCount: completedToday.length,
    remainingTodayCount: todayTasks.length - completedToday.length,
    habits: habitsToday,
    habitsCompletedToday,
    goals,
    focusMinutesToday,
    productivityScore: scoreResult,
    gamification,
    overdueCount: overdue.length,
    insights: insights.slice(0, 4),
    notifications,
    settings,
  });
});
