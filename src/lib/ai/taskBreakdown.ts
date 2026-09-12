export interface SubtaskDraft {
  title: string;
  estimatedMinutes: number;
  priority: "critical" | "high" | "medium" | "low";
  daysFromNow: number; // suggested deadline offset
}

interface Template {
  match: RegExp;
  steps: { title: string; minutes: number; priority: SubtaskDraft["priority"]; day: number }[];
}

const TEMPLATES: Template[] = [
  {
    match: /project|app|application|system|platform/i,
    steps: [
      { title: "Define project requirements", minutes: 60, priority: "high", day: 1 },
      { title: "Research technology & tools", minutes: 90, priority: "high", day: 2 },
      { title: "Design database schema", minutes: 90, priority: "high", day: 3 },
      { title: "Design UI/UX wireframes", minutes: 120, priority: "medium", day: 4 },
      { title: "Build backend / APIs", minutes: 300, priority: "high", day: 8 },
      { title: "Build frontend", minutes: 300, priority: "high", day: 12 },
      { title: "Integrate APIs & third-party services", minutes: 150, priority: "medium", day: 14 },
      { title: "Testing & bug fixing", minutes: 180, priority: "high", day: 16 },
      { title: "Write documentation", minutes: 90, priority: "medium", day: 18 },
      { title: "Prepare final presentation", minutes: 60, priority: "critical", day: 20 },
    ],
  },
  {
    match: /study|exam|learn|course/i,
    steps: [
      { title: "Gather study materials & syllabus", minutes: 30, priority: "medium", day: 0 },
      { title: "Create a study schedule", minutes: 30, priority: "high", day: 0 },
      { title: "Review core concepts", minutes: 90, priority: "high", day: 1 },
      { title: "Practice problems / past papers", minutes: 90, priority: "high", day: 3 },
      { title: "Revise weak areas", minutes: 60, priority: "medium", day: 5 },
      { title: "Take a practice test", minutes: 90, priority: "high", day: 6 },
      { title: "Final review", minutes: 60, priority: "critical", day: 7 },
    ],
  },
  {
    match: /event|wedding|party|trip|travel/i,
    steps: [
      { title: "Set budget & guest/participant list", minutes: 45, priority: "high", day: 0 },
      { title: "Book venue / accommodation", minutes: 60, priority: "critical", day: 2 },
      { title: "Arrange transportation", minutes: 45, priority: "medium", day: 4 },
      { title: "Send invitations / confirm plans", minutes: 30, priority: "medium", day: 5 },
      { title: "Finalize logistics", minutes: 60, priority: "high", day: 10 },
      { title: "Day-of checklist & confirmations", minutes: 30, priority: "critical", day: 14 },
    ],
  },
  {
    match: /write|report|article|blog|documentation|essay/i,
    steps: [
      { title: "Outline structure & key points", minutes: 30, priority: "high", day: 0 },
      { title: "Research & gather references", minutes: 60, priority: "medium", day: 1 },
      { title: "Write first draft", minutes: 120, priority: "high", day: 2 },
      { title: "Review & edit", minutes: 60, priority: "medium", day: 3 },
      { title: "Proofread & finalize", minutes: 30, priority: "high", day: 4 },
    ],
  },
];

const GENERIC_STEPS = [
  { title: "Plan & scope the task", minutes: 20, priority: "medium" as const, day: 0 },
  { title: "Gather required resources", minutes: 30, priority: "medium" as const, day: 0 },
  { title: "Work on core part 1", minutes: 60, priority: "high" as const, day: 1 },
  { title: "Work on core part 2", minutes: 60, priority: "high" as const, day: 2 },
  { title: "Review & refine", minutes: 30, priority: "medium" as const, day: 3 },
  { title: "Finalize & wrap up", minutes: 20, priority: "high" as const, day: 4 },
];

/**
 * Breaks a big task/goal down into an ordered list of subtasks using
 * keyword-matched templates (mirrors what a project-planning AI would
 * output). Falls back to a generic 6-step plan for anything unmatched.
 */
export function breakdownTask(title: string): SubtaskDraft[] {
  const template = TEMPLATES.find((t) => t.match.test(title));
  const steps = template?.steps ?? GENERIC_STEPS;
  return steps.map((s) => ({
    title: s.title,
    estimatedMinutes: s.minutes,
    priority: s.priority,
    daysFromNow: s.day,
  }));
}
