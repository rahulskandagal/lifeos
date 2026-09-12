import type { Task } from "@/types";

export interface PriorityScoreResult {
  score: number; // 0-100
  reasons: string[];
}

/**
 * AI Priority Score = weighted combination of:
 *  - Urgency (days until deadline)
 *  - Stated importance (priority field)
 *  - Effort (shorter, high-value tasks score a bonus for quick wins)
 *  - Dependencies (blocking other tasks raises priority)
 *  - Postponement history (repeatedly delayed tasks get nudged up)
 */
export function computePriorityScore(
  task: Pick<Task, "priority" | "date" | "estimatedMinutes" | "postponeCount">,
  opts: { blocksCount?: number; today?: Date } = {}
): PriorityScoreResult {
  const today = opts.today ?? new Date();
  const reasons: string[] = [];
  let score = 40;

  const importanceMap: Record<string, number> = { critical: 30, high: 20, medium: 8, low: 0 };
  score += importanceMap[task.priority] ?? 8;
  reasons.push(`Stated priority: ${task.priority}`);

  if (task.date) {
    const due = new Date(task.date);
    const daysUntil = Math.ceil((due.getTime() - today.getTime()) / 86400000);
    if (daysUntil < 0) {
      score += 25;
      reasons.push("Overdue — deadline has passed");
    } else if (daysUntil === 0) {
      score += 22;
      reasons.push("Due today");
    } else if (daysUntil <= 2) {
      score += 15;
      reasons.push(`Due in ${daysUntil} day(s)`);
    } else if (daysUntil <= 7) {
      score += 6;
      reasons.push("Due within a week");
    }
  }

  if (task.estimatedMinutes && task.estimatedMinutes <= 20) {
    score += 5;
    reasons.push("Quick win (≤20 min)");
  }

  if (opts.blocksCount && opts.blocksCount > 0) {
    score += Math.min(15, opts.blocksCount * 7);
    reasons.push(`Blocks ${opts.blocksCount} other task(s)`);
  }

  if (task.postponeCount && task.postponeCount > 0) {
    score += Math.min(10, task.postponeCount * 3);
    reasons.push(`Postponed ${task.postponeCount} time(s)`);
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  return { score, reasons };
}
