export interface ScoreInputs {
  tasksCompleted: number;
  tasksPlanned: number;
  focusMinutes: number;
  focusGoalMinutes: number;
  habitsCompleted: number;
  habitsPlanned: number;
  goalsProgressDelta: number; // average % progress across active goals, 0-100
  currentStreak: number;
}

export interface ScoreResult {
  score: number;
  taskCompletionPct: number;
  focusPct: number;
  habitPct: number;
  goalPct: number;
  consistencyPct: number;
  explanation: string[];
}

function pct(done: number, total: number): number {
  if (total <= 0) return done > 0 ? 100 : 0;
  return Math.round(Math.min(1, done / total) * 100);
}

/**
 * Daily productivity score, weighted:
 *   Task completion 30%, Focus 25%, Habits 20%, Goals 15%, Consistency 10%
 */
export function computeProductivityScore(inputs: ScoreInputs): ScoreResult {
  const taskCompletionPct = pct(inputs.tasksCompleted, inputs.tasksPlanned);
  const focusPct = pct(inputs.focusMinutes, inputs.focusGoalMinutes);
  const habitPct = pct(inputs.habitsCompleted, inputs.habitsPlanned);
  const goalPct = Math.round(inputs.goalsProgressDelta);
  const consistencyPct = Math.min(100, Math.round((inputs.currentStreak / 14) * 100));

  const score = Math.round(taskCompletionPct * 0.3 + focusPct * 0.25 + habitPct * 0.2 + goalPct * 0.15 + consistencyPct * 0.1);

  const explanation: string[] = [
    `Task completion: ${taskCompletionPct}% (${inputs.tasksCompleted}/${inputs.tasksPlanned || 0})`,
    `Focus: ${focusPct}% (${inputs.focusMinutes}/${inputs.focusGoalMinutes} min)`,
    `Habits: ${habitPct}% (${inputs.habitsCompleted}/${inputs.habitsPlanned || 0})`,
    `Goals momentum: ${goalPct}%`,
    `Consistency: ${consistencyPct}% (${inputs.currentStreak}-day streak)`,
  ];

  return { score: Math.max(0, Math.min(100, score)), taskCompletionPct, focusPct, habitPct, goalPct, consistencyPct, explanation };
}
