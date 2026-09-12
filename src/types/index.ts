// Shared domain types for LifeOS

export type Priority = "critical" | "high" | "medium" | "low";
export type EnergyLevel = "high" | "medium" | "low";
export type TaskStatus = "todo" | "in_progress" | "review" | "completed";
export type KanbanColumn = "backlog" | "todo" | "in_progress" | "review" | "completed";
export type GoalTerm = "short" | "medium" | "long";
export type Mood = "great" | "good" | "okay" | "bad" | "rough";

export interface RepeatRule {
  freq: "daily" | "weekly" | "monthly" | "yearly" | "custom";
  interval?: number;
  byDay?: string[]; // ['MO','TU',...]
  until?: string; // ISO date
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserSettings {
  id: string;
  userId: string;
  theme: "light" | "dark" | "system";
  accentColor: string;
  language: string;
  workingHoursStart: string;
  workingHoursEnd: string;
  productiveHoursStart: string;
  productiveHoursEnd: string;
  dailyFocusGoalMinutes: number;
  dailyTaskGoal: number;
  notifyTaskDue: boolean;
  notifyHabit: boolean;
  notifyGoalMilestone: boolean;
  notifyMorningBriefing: boolean;
  notifyEveningReview: boolean;
  aiAutoPrioritize: boolean;
  aiAutoBreakdown: boolean;
  aiProactiveInsights: boolean;
  pomodoroFocusMin: number;
  pomodoroBreakMin: number;
  pomodoroLongBreakMin: number;
  weekStartsOn: number;
  updatedAt: string;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  icon: string;
  color: string;
  isDefault: boolean;
  createdAt: string;
}

export interface Tag {
  id: string;
  userId: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  description?: string | null;
  color: string;
  status: "active" | "archived" | "completed";
  deadline?: string | null;
  progress: number;
  createdAt: string;
  updatedAt: string;
  members?: ProjectMember[];
  milestones?: ProjectMilestone[];
  taskCount?: number;
  completedTaskCount?: number;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  name: string;
  email?: string | null;
  role: string;
  avatarUrl?: string | null;
  createdAt: string;
}

export interface ProjectMilestone {
  id: string;
  projectId: string;
  title: string;
  dueDate?: string | null;
  completed: boolean;
  createdAt: string;
}

export interface Task {
  id: string;
  userId: string;
  projectId?: string | null;
  parentTaskId?: string | null;
  title: string;
  description?: string | null;
  status: TaskStatus;
  kanbanColumn: KanbanColumn;
  priority: Priority;
  aiPriorityScore?: number | null;
  category?: string | null;
  date?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  estimatedMinutes?: number | null;
  actualMinutes?: number | null;
  location?: string | null;
  reminderMinutesBefore?: number | null;
  repeatRule?: string | null;
  notes?: string | null;
  energyLevel?: EnergyLevel | null;
  postponeCount: number;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  tags?: Tag[];
  subtasks?: Task[];
  dependsOn?: string[];
  attachments?: Attachment[];
}

export interface Attachment {
  id: string;
  taskId?: string | null;
  noteId?: string | null;
  fileName: string;
  fileType?: string | null;
  fileSize?: number | null;
  createdAt: string;
}

export interface Habit {
  id: string;
  userId: string;
  name: string;
  icon: string;
  color: string;
  category?: string | null;
  frequency: "daily" | "weekly" | "custom";
  targetPerWeek: number;
  reminderTime?: string | null;
  goalId?: string | null;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  logs?: HabitLog[];
  currentStreak?: number;
  bestStreak?: number;
  successPct?: number;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string;
  completed: boolean;
  note?: string | null;
  createdAt: string;
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description?: string | null;
  term: GoalTerm;
  category?: string | null;
  targetDate?: string | null;
  progress: number;
  status: "active" | "completed" | "abandoned";
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  milestones?: GoalMilestone[];
}

export interface GoalMilestone {
  id: string;
  goalId: string;
  title: string;
  completed: boolean;
  dueDate?: string | null;
  orderIndex: number;
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  userId: string;
  taskId?: string | null;
  title: string;
  description?: string | null;
  date: string;
  startTime: string;
  endTime: string;
  color: string;
  location?: string | null;
  repeatRule?: string | null;
  allDay: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  userId: string;
  title: string;
  content?: string | null;
  type: "note" | "checklist";
  taskId?: string | null;
  projectId?: string | null;
  goalId?: string | null;
  pinned: boolean;
  favorite: boolean;
  color: string;
  createdAt: string;
  updatedAt: string;
  tags?: Tag[];
}

export interface Journal {
  id: string;
  userId: string;
  date: string;
  whatHappened?: string | null;
  accomplishments?: string | null;
  wentWell?: string | null;
  wentWrong?: string | null;
  improvements?: string | null;
  tomorrowPriorities?: string | null;
  mood?: Mood | null;
  aiSummary?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FocusSession {
  id: string;
  userId: string;
  taskId?: string | null;
  mode: "pomodoro" | "custom" | "deep_work";
  plannedMinutes: number;
  actualMinutes?: number | null;
  startedAt: string;
  endedAt?: string | null;
  completed: boolean;
  interrupted: boolean;
  createdAt: string;
}

export interface ProductivityScore {
  id: string;
  userId: string;
  date: string;
  score: number;
  taskCompletionPct: number;
  focusPct: number;
  habitPct: number;
  goalPct: number;
  consistencyPct: number;
  breakdown?: string | null;
  createdAt: string;
}

export interface GamificationProfile {
  id: string;
  userId: string;
  xp: number;
  level: number;
  currentStreak: number;
  bestStreak: number;
  lastActiveDate?: string | null;
  updatedAt: string;
}

export interface Badge {
  id: string;
  userId: string;
  key: string;
  title: string;
  description?: string | null;
  icon: string;
  earnedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message?: string | null;
  icon: string;
  link?: string | null;
  read: boolean;
  createdAt: string;
}

export interface AIInteraction {
  id: string;
  userId: string;
  role: "user" | "assistant";
  content: string;
  actionsJson?: string | null;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  entityType: string;
  entityId?: string | null;
  action: string;
  detail?: string | null;
  createdAt: string;
}

export const DEFAULT_CATEGORIES: { name: string; icon: string; color: string }[] = [
  { name: "Study", icon: "📚", color: "#6366F1" },
  { name: "Work", icon: "💻", color: "#3B82F6" },
  { name: "Fitness", icon: "🏋️", color: "#F59E0B" },
  { name: "Personal", icon: "🏠", color: "#10B981" },
  { name: "Finance", icon: "💰", color: "#22C55E" },
  { name: "Shopping", icon: "🛒", color: "#EC4899" },
  { name: "Family", icon: "👨‍👩‍👧", color: "#F97316" },
  { name: "Goals", icon: "🎯", color: "#EF4444" },
  { name: "Learning", icon: "🧠", color: "#8B5CF6" },
  { name: "Ideas", icon: "💡", color: "#EAB308" },
];
