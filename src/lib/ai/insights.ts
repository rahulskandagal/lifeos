import type { Task, Habit, FocusSession, Goal } from "@/types";

export interface Insight {
  icon: string;
  text: string;
  category: "pattern" | "warning" | "achievement" | "recommendation";
}

/**
 * Analyzes recent task/focus/habit history to produce human-readable
 * insights, in the same spirit as an LLM would summarize behavior — but
 * computed deterministically from real data so it's always accurate.
 */
export function generateInsights(params: {
  completedTasks: Task[];
  allRecentTasks: Task[];
  focusSessions: FocusSession[];
  habits: Habit[];
  goals: Goal[];
}): Insight[] {
  const { completedTasks, allRecentTasks, focusSessions, habits, goals } = params;
  const insights: Insight[] = [];

  // Most productive hour range from completed tasks' start times
  const hourCounts: Record<number, number> = {};
  for (const t of completedTasks) {
    if (t.startTime) {
      const hour = parseInt(t.startTime.split(":")[0], 10);
      hourCounts[hour] = (hourCounts[hour] ?? 0) + 1;
    }
  }
  const bestHourEntry = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];
  if (bestHourEntry && bestHourEntry[1] >= 3) {
    const hour = parseInt(bestHourEntry[0], 10);
    insights.push({
      icon: "⏰",
      category: "pattern",
      text: `You complete most tasks around ${formatHour(hour)}–${formatHour(hour + 2)}. Consider scheduling your hardest work then.`,
    });
  }

  // Late-task postponement pattern
  const lateTasks = allRecentTasks.filter((t) => t.startTime && parseInt(t.startTime.split(":")[0], 10) >= 20);
  const latePostponed = lateTasks.filter((t) => t.postponeCount > 0);
  if (lateTasks.length >= 3 && latePostponed.length / lateTasks.length > 0.4) {
    insights.push({
      icon: "🌙",
      category: "warning",
      text: `You postpone ${Math.round((latePostponed.length / lateTasks.length) * 100)}% of tasks scheduled after 8 PM. Try moving them earlier.`,
    });
  }

  // Category completion rate (e.g., Study)
  const byCategory: Record<string, { total: number; done: number }> = {};
  for (const t of allRecentTasks) {
    const cat = t.category ?? "Uncategorized";
    byCategory[cat] ??= { total: 0, done: 0 };
    byCategory[cat].total++;
    if (t.status === "completed") byCategory[cat].done++;
  }
  for (const [cat, stats] of Object.entries(byCategory)) {
    if (stats.total >= 4) {
      const pct = Math.round((stats.done / stats.total) * 100);
      insights.push({ icon: "📊", category: "pattern", text: `You completed ${pct}% of your ${cat} tasks recently.` });
    }
  }

  // Focus session trend
  if (focusSessions.length >= 3) {
    const totalMinutes = focusSessions.reduce((s, f) => s + (f.actualMinutes ?? 0), 0);
    const avg = Math.round(totalMinutes / focusSessions.length);
    insights.push({ icon: "🎯", category: "pattern", text: `Your average focus session lasts ${avg} minutes across ${focusSessions.length} sessions.` });
  }

  // Habit consistency
  const strongHabits = habits.filter((h) => (h.successPct ?? 0) >= 80);
  const weakHabits = habits.filter((h) => (h.successPct ?? 0) < 40 && (h.logs?.length ?? 0) > 3);
  if (strongHabits.length) {
    insights.push({ icon: "🔥", category: "achievement", text: `Great consistency on ${strongHabits.map((h) => h.name).join(", ")} — keep it up!` });
  }
  if (weakHabits.length) {
    insights.push({ icon: "💡", category: "recommendation", text: `${weakHabits.map((h) => h.name).join(", ")} could use more attention — try a smaller daily target.` });
  }

  // Goal progress
  const stagnantGoals = goals.filter((g) => g.status === "active" && g.progress < 20);
  if (stagnantGoals.length) {
    insights.push({ icon: "🎯", category: "recommendation", text: `${stagnantGoals.map((g) => g.title).join(", ")} ${stagnantGoals.length > 1 ? "haven't" : "hasn't"} moved much lately — break the next milestone into smaller tasks.` });
  }

  // Repeatedly postponed tasks
  const chronic = allRecentTasks.filter((t) => t.postponeCount >= 3 && t.status !== "completed");
  for (const t of chronic.slice(0, 3)) {
    insights.push({ icon: "⚠️", category: "warning", text: `"${t.title}" has been postponed ${t.postponeCount} times — consider breaking it down or changing its deadline.` });
  }

  if (!insights.length) {
    insights.push({ icon: "✨", category: "pattern", text: "Complete a few more tasks and focus sessions to unlock personalized insights." });
  }

  return insights;
}

function formatHour(hour: number): string {
  const h = hour % 24;
  const period = h >= 12 ? "PM" : "AM";
  const display = h % 12 === 0 ? 12 : h % 12;
  return `${display}${period}`;
}
