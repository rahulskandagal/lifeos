import { NextResponse } from "next/server";
import { withAuth } from "@/lib/apiHandler";
import { TasksRepo, HabitsRepo, GoalsRepo, FocusRepo } from "@/lib/db/repositories";
import { generateInsights } from "@/lib/ai/insights";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withAuth(async (_req, { userId }) => {
  const today = new Date().toISOString().slice(0, 10);
  const from = new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10);
  const recentTasks = TasksRepo.listTasks(userId, { dateFrom: from, dateTo: today });
  const focusSessions = FocusRepo.listFocusSessions(userId, from, new Date().toISOString());
  const habits = HabitsRepo.listHabits(userId);
  const goals = GoalsRepo.listGoals(userId);

  const insights = generateInsights({
    completedTasks: recentTasks.filter((t) => t.status === "completed"),
    allRecentTasks: recentTasks,
    focusSessions,
    habits,
    goals,
  });

  return NextResponse.json({ insights });
});
