import { db, newId, nowISO } from "@/lib/db/client";
import { TasksRepo, HabitsRepo, GoalsRepo, ProjectsRepo, NotesRepo, JournalRepo, FocusRepo, CalendarRepo, GamificationRepo, NotificationsRepo } from "@/lib/db/repositories";
import { computePriorityScore } from "@/lib/ai/priorityScoring";

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
}
function daysFromNow(n: number): string {
  return new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
}

/**
 * Populates a freshly created account with realistic demo data so the app
 * feels alive on first login: an in-progress project, a mix of today's /
 * upcoming / overdue tasks, habit streaks with history, goals at various
 * stages, notes, journal entries, and focus session history.
 */
export function seedDemoDataForUser(userId: string) {
  // ---- Project ----
  const project = ProjectsRepo.createProject(userId, {
    name: "Final Year Project",
    description: "AI-powered campus assistant — capstone project for final semester.",
    color: "#7C3AED",
    deadline: daysFromNow(30),
    members: ["You", "Priya Sharma", "Rahul Verma"],
    milestones: ["Requirements finalized", "Backend MVP", "Frontend MVP", "Integration & testing", "Final submission"],
  });

  // ---- Goals ----
  const learnPython = GoalsRepo.createGoal(userId, {
    title: "Learn Python",
    description: "Get comfortable with Python for data work and backend scripting.",
    term: "medium",
    category: "Learning",
    targetDate: daysFromNow(45),
    milestones: ["Python basics", "Functions & modules", "OOP in Python", "Django fundamentals", "Build 2 projects"],
  });
  db.prepare(`UPDATE GoalMilestone SET completed = 1 WHERE goalId = ? AND orderIndex IN (0,1,2)`).run(learnPython.id);
  GoalsRepo.recalcGoalProgress(learnPython.id);

  const finalProject = GoalsRepo.createGoal(userId, {
    title: "Complete final year project",
    description: "Ship the capstone project with a working demo.",
    term: "medium",
    category: "Goals",
    targetDate: daysFromNow(30),
    milestones: ["Requirements", "Design", "Build", "Test", "Present"],
  });
  db.prepare(`UPDATE GoalMilestone SET completed = 1 WHERE goalId = ? AND orderIndex = 0`).run(finalProject.id);
  GoalsRepo.recalcGoalProgress(finalProject.id);

  const fitnessGoal = GoalsRepo.createGoal(userId, {
    title: "Improve fitness",
    description: "Build a consistent workout habit and improve stamina.",
    term: "long",
    category: "Fitness",
    targetDate: daysFromNow(180),
    milestones: ["Workout 3x/week for a month", "Run 5k without stopping", "Hit target weight"],
  });

  GoalsRepo.createGoal(userId, {
    title: "Read 12 books this year",
    term: "long",
    category: "Personal",
    targetDate: daysFromNow(200),
    milestones: ["3 books read", "6 books read", "9 books read", "12 books read"],
  });
  const readingGoal = GoalsRepo.listGoals(userId, "long").find((g) => g.title.includes("Read"))!;
  db.prepare(`UPDATE GoalMilestone SET completed = 1 WHERE goalId = ? AND orderIndex = 0`).run(readingGoal.id);
  GoalsRepo.recalcGoalProgress(readingGoal.id);

  GoalsRepo.createGoal(userId, {
    title: "Save ₹50,000 emergency fund",
    term: "short",
    category: "Finance",
    targetDate: daysFromNow(60),
    milestones: ["₹15,000 saved", "₹30,000 saved", "₹50,000 saved"],
  });

  // ---- Habits (with ~3 weeks of history) ----
  const habitDefs = [
    { name: "Exercise", icon: "🏋️", color: "#F59E0B", category: "Fitness", targetPerWeek: 5, rate: 0.75 },
    { name: "Study", icon: "📚", color: "#6366F1", category: "Study", targetPerWeek: 6, rate: 0.85 },
    { name: "Drink Water", icon: "💧", color: "#3B82F6", category: "Personal", targetPerWeek: 7, rate: 0.9 },
    { name: "Read", icon: "📖", color: "#10B981", category: "Learning", targetPerWeek: 5, rate: 0.6 },
    { name: "Meditation", icon: "🧘", color: "#8B5CF6", category: "Personal", targetPerWeek: 7, rate: 0.35 },
  ];
  for (const def of habitDefs) {
    const habit = HabitsRepo.createHabit(userId, { name: def.name, icon: def.icon, color: def.color, category: def.category, targetPerWeek: def.targetPerWeek });
    for (let i = 20; i >= 0; i--) {
      if (Math.random() < def.rate) {
        HabitsRepo.toggleHabitLog(userId, habit.id, daysAgo(i));
      }
    }
    // Ensure a strong recent streak for the top habits so the dashboard looks alive
    if (def.rate >= 0.75) {
      for (let i = 0; i <= 3; i++) HabitsRepo.toggleHabitLog(userId, habit.id, daysAgo(i));
    }
  }

  // ---- Tasks ----
  const categories = ["Study", "Work", "Fitness", "Personal", "Goals"];
  const priorities: ("critical" | "high" | "medium" | "low")[] = ["critical", "high", "medium", "low"];

  const todayTasks = [
    { title: "Complete DBMS assignment", category: "Study", priority: "high", startTime: "09:00", endTime: "10:30", estimatedMinutes: 90 },
    { title: "Study Python — OOP concepts", category: "Study", priority: "high", startTime: "11:00", endTime: "12:00", estimatedMinutes: 60 },
    { title: "Morning workout", category: "Fitness", priority: "medium", startTime: "07:00", endTime: "07:45", estimatedMinutes: 45 },
    { title: "Team standup call", category: "Work", priority: "medium", startTime: "10:00", endTime: "10:15", estimatedMinutes: 15 },
    { title: "Read 20 pages", category: "Learning", priority: "low", startTime: "20:30", endTime: "21:00", estimatedMinutes: 30 },
  ] as const;

  for (const t of todayTasks) {
    const task = TasksRepo.createTask(userId, {
      title: t.title,
      category: t.category,
      priority: t.priority,
      date: daysAgo(0),
      startTime: t.startTime,
      endTime: t.endTime,
      estimatedMinutes: t.estimatedMinutes,
      projectId: t.title.includes("assignment") ? undefined : undefined,
    });
    const { score } = computePriorityScore(task);
    TasksRepo.updateTask(userId, task.id, { aiPriorityScore: score });
  }

  // Mark a couple of today's tasks completed already (feels lived-in)
  const todayList = TasksRepo.listTasks(userId, { date: daysAgo(0) });
  if (todayList[3]) TasksRepo.completeTask(userId, todayList[3].id, 12);

  // Upcoming tasks (next 6 days)
  const upcomingTitles = [
    "Design database schema for capstone project",
    "Build backend API for capstone project",
    "Prepare presentation slides",
    "Submit assignment 3",
    "Grocery shopping",
    "Call bank about loan",
    "Plan weekend trip",
    "Review pull requests",
    "Write blog post about AI trends",
    "Doctor's appointment",
  ];
  upcomingTitles.forEach((title, idx) => {
    const task = TasksRepo.createTask(userId, {
      title,
      category: categories[idx % categories.length],
      priority: priorities[idx % priorities.length],
      date: daysFromNow((idx % 6) + 1),
      estimatedMinutes: [30, 45, 60, 90, 120][idx % 5],
      projectId: title.toLowerCase().includes("capstone") ? project.id : undefined,
    });
    const { score } = computePriorityScore(task);
    TasksRepo.updateTask(userId, task.id, { aiPriorityScore: score });
  });

  // Overdue tasks
  const overdueTitles = ["Submit fee payment", "Reply to professor's email", "Finish lab report"];
  overdueTitles.forEach((title, idx) => {
    const task = TasksRepo.createTask(userId, {
      title,
      category: "Study",
      priority: idx === 0 ? "critical" : "high",
      date: daysAgo(idx + 1),
      estimatedMinutes: 30,
    });
    TasksRepo.updateTask(userId, task.id, { postponeCount: idx + 1 } as any);
    const { score } = computePriorityScore(TasksRepo.getTaskById(task.id)!);
    TasksRepo.updateTask(userId, task.id, { aiPriorityScore: score });
  });

  // Completed tasks over the past 2 weeks (for analytics)
  const completedTitles = [
    "Finish React module", "Complete linear algebra homework", "Gym session", "Team meeting notes",
    "Update resume", "Water the plants", "Weekly grocery run", "Refactor auth module",
    "Study data structures", "Morning run", "Submit assignment 2", "Read chapter 4",
  ];
  completedTitles.forEach((title, idx) => {
    const dayOffset = (idx % 13) + 1;
    const task = TasksRepo.createTask(userId, {
      title,
      category: categories[idx % categories.length],
      priority: priorities[idx % priorities.length],
      date: daysAgo(dayOffset),
      startTime: `${8 + (idx % 10)}:00`,
      estimatedMinutes: 30 + (idx % 4) * 30,
    });
    TasksRepo.completeTask(userId, task.id, 30 + (idx % 4) * 30);
  });

  // A task with subtasks & dependencies to showcase the feature
  const parent = TasksRepo.createTask(userId, { title: "Launch personal portfolio website", category: "Work", priority: "high", date: daysFromNow(10), estimatedMinutes: 300 });
  const sub1 = TasksRepo.addSubtask(userId, parent.id, "Design homepage layout");
  const sub2 = TasksRepo.addSubtask(userId, parent.id, "Write project descriptions");
  const sub3 = TasksRepo.addSubtask(userId, parent.id, "Deploy to Vercel");
  TasksRepo.updateTask(userId, sub3.id, { dependsOn: [sub1.id, sub2.id] });
  TasksRepo.completeTask(userId, sub1.id, 60);

  // ---- Calendar events (fixed) ----
  CalendarRepo.createEvent(userId, { title: "Team Standup", date: daysAgo(0), startTime: "10:00", endTime: "10:15", color: "#3B82F6" });
  CalendarRepo.createEvent(userId, { title: "DBMS Lecture", date: daysFromNow(1), startTime: "14:00", endTime: "15:30", color: "#6366F1" });
  CalendarRepo.createEvent(userId, { title: "Project Review Meeting", date: daysFromNow(3), startTime: "16:00", endTime: "17:00", color: "#7C3AED" });
  CalendarRepo.createEvent(userId, { title: "Dentist Appointment", date: daysFromNow(5), startTime: "11:00", endTime: "12:00", color: "#F97316" });

  // ---- Notes ----
  NotesRepo.createNote(userId, { title: "Project Ideas", content: "- AI campus assistant\n- Smart attendance system\n- Personal finance tracker\n\nPick one and validate feasibility this week." });
  const n1 = NotesRepo.createNote(userId, { title: "DBMS — Normalization Notes", content: "## Normal Forms\n1NF: atomic values\n2NF: no partial dependency\n3NF: no transitive dependency\n\nReview before the exam." });
  NotesRepo.updateNote(userId, n1.id, { pinned: true });
  NotesRepo.createNote(userId, { title: "Books to read", content: "- Atomic Habits\n- Deep Work\n- The Pragmatic Programmer", type: "checklist" });
  NotesRepo.createNote(userId, { title: "Meeting notes — Capstone kickoff", content: "Discussed scope, timeline, and role split with Priya & Rahul. Backend: me, Frontend: Priya, ML: Rahul." });

  // ---- Journal (last 5 days) ----
  const moods: ("great" | "good" | "okay" | "bad" | "rough")[] = ["good", "great", "okay", "good", "great"];
  for (let i = 4; i >= 0; i--) {
    JournalRepo.upsertJournal(userId, daysAgo(i), {
      whatHappened: "Worked through most of the planned tasks, had a productive study block in the morning.",
      accomplishments: "Finished DBMS assignment draft, completed workout, reviewed capstone requirements.",
      wentWell: "Morning focus session was very productive.",
      wentWrong: i === 2 ? "Got distracted after lunch and lost about an hour." : "Nothing major.",
      improvements: "Start the hardest task first thing in the morning.",
      tomorrowPriorities: "Continue capstone backend work, study OOP, go for a run.",
      mood: moods[4 - i],
    });
  }

  // ---- Focus sessions (last 10 days) ----
  for (let i = 9; i >= 0; i--) {
    const sessionsToday = 1 + Math.floor(Math.random() * 3);
    for (let s = 0; s < sessionsToday; s++) {
      const planned = [25, 25, 50][s % 3];
      const started = new Date(Date.now() - i * 86400000);
      started.setHours(9 + s * 2, 0, 0, 0);
      const session = FocusRepo.startFocusSession(userId, { plannedMinutes: planned, mode: "pomodoro" });
      db.prepare(`UPDATE FocusSession SET startedAt = ? WHERE id = ?`).run(started.toISOString(), session.id);
      FocusRepo.endFocusSession(userId, session.id, { actualMinutes: planned - (Math.random() < 0.2 ? 5 : 0), completed: true });
    }
  }

  // ---- Notifications ----
  NotificationsRepo.createNotification(userId, { type: "task_due", title: "Task due soon", message: '"Complete DBMS assignment" is due today at 10:30 AM', icon: "🔔" });
  NotificationsRepo.createNotification(userId, { type: "habit_streak", title: "Habit streak maintained", message: "You're on a 4-day streak for Study 🔥", icon: "🔥" });
  NotificationsRepo.createNotification(userId, { type: "goal_milestone", title: "Goal milestone achieved", message: '"Python basics" milestone completed for Learn Python', icon: "🎯" });
  NotificationsRepo.createNotification(userId, { type: "weekly_report", title: "Weekly report available", message: "Your productivity increased 14% vs last week", icon: "📊" });
  NotificationsRepo.createNotification(userId, { type: "ai_recommendation", title: "AI recommendation", message: "You focus best 9–12 AM — schedule hard tasks then.", icon: "🤖" });

  // ---- Gamification ----
  GamificationRepo.addXP(userId, 1240);
  GamificationRepo.touchActivityStreak(userId);
  db.prepare(`UPDATE GamificationProfile SET currentStreak = 6, bestStreak = 14, updatedAt = ? WHERE userId = ?`).run(nowISO(), userId);
  GamificationRepo.checkAndAwardBadges(userId);
}
