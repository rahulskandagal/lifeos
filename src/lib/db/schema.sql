-- LifeOS Database Schema (SQLite dialect, portable to PostgreSQL — see docs/postgres-schema.sql)
-- Uses TEXT for ids (uuid), TEXT for ISO datetimes, INTEGER for booleans (0/1).

PRAGMA foreign_keys = ON;

-- ==================== USERS & SETTINGS ====================

CREATE TABLE IF NOT EXISTS User (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  passwordHash TEXT NOT NULL,
  avatarUrl TEXT,
  timezone TEXT DEFAULT 'UTC',
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS UserSettings (
  id TEXT PRIMARY KEY,
  userId TEXT UNIQUE NOT NULL REFERENCES User(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'system', -- light | dark | system
  accentColor TEXT DEFAULT 'violet',
  language TEXT DEFAULT 'en',
  workingHoursStart TEXT DEFAULT '09:00',
  workingHoursEnd TEXT DEFAULT '18:00',
  productiveHoursStart TEXT DEFAULT '09:00',
  productiveHoursEnd TEXT DEFAULT '12:00',
  dailyFocusGoalMinutes INTEGER DEFAULT 120,
  dailyTaskGoal INTEGER DEFAULT 5,
  notifyTaskDue INTEGER DEFAULT 1,
  notifyHabit INTEGER DEFAULT 1,
  notifyGoalMilestone INTEGER DEFAULT 1,
  notifyMorningBriefing INTEGER DEFAULT 1,
  notifyEveningReview INTEGER DEFAULT 1,
  aiAutoPrioritize INTEGER DEFAULT 1,
  aiAutoBreakdown INTEGER DEFAULT 1,
  aiProactiveInsights INTEGER DEFAULT 1,
  pomodoroFocusMin INTEGER DEFAULT 25,
  pomodoroBreakMin INTEGER DEFAULT 5,
  pomodoroLongBreakMin INTEGER DEFAULT 15,
  weekStartsOn INTEGER DEFAULT 1, -- 0 = Sunday
  updatedAt TEXT NOT NULL
);

-- ==================== CATEGORIES & TAGS ====================

CREATE TABLE IF NOT EXISTS Category (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES User(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '📁',
  color TEXT DEFAULT '#7C3AED',
  isDefault INTEGER DEFAULT 0,
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS Tag (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES User(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#64748B',
  createdAt TEXT NOT NULL,
  UNIQUE(userId, name)
);

-- ==================== PROJECTS ====================

CREATE TABLE IF NOT EXISTS Project (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES User(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  status TEXT DEFAULT 'active', -- active | archived | completed
  deadline TEXT,
  progress INTEGER DEFAULT 0,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ProjectMember (
  id TEXT PRIMARY KEY,
  projectId TEXT NOT NULL REFERENCES Project(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  role TEXT DEFAULT 'member',
  avatarUrl TEXT,
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ProjectMilestone (
  id TEXT PRIMARY KEY,
  projectId TEXT NOT NULL REFERENCES Project(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  dueDate TEXT,
  completed INTEGER DEFAULT 0,
  createdAt TEXT NOT NULL
);

-- ==================== TASKS ====================

CREATE TABLE IF NOT EXISTS Task (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES User(id) ON DELETE CASCADE,
  projectId TEXT REFERENCES Project(id) ON DELETE SET NULL,
  parentTaskId TEXT REFERENCES Task(id) ON DELETE CASCADE, -- for subtasks
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'todo', -- todo | in_progress | review | completed
  kanbanColumn TEXT DEFAULT 'todo', -- backlog | todo | in_progress | review | completed
  priority TEXT DEFAULT 'medium', -- critical | high | medium | low
  aiPriorityScore INTEGER,
  category TEXT,
  date TEXT, -- ISO date (yyyy-mm-dd)
  startTime TEXT, -- HH:mm
  endTime TEXT, -- HH:mm
  estimatedMinutes INTEGER,
  actualMinutes INTEGER,
  location TEXT,
  reminderMinutesBefore INTEGER,
  repeatRule TEXT, -- JSON: {freq, interval, byDay, until}
  notes TEXT,
  energyLevel TEXT, -- high | medium | low
  postponeCount INTEGER DEFAULT 0,
  completedAt TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS TaskDependency (
  id TEXT PRIMARY KEY,
  taskId TEXT NOT NULL REFERENCES Task(id) ON DELETE CASCADE,
  dependsOnTaskId TEXT NOT NULL REFERENCES Task(id) ON DELETE CASCADE,
  createdAt TEXT NOT NULL,
  UNIQUE(taskId, dependsOnTaskId)
);

CREATE TABLE IF NOT EXISTS TaskTag (
  taskId TEXT NOT NULL REFERENCES Task(id) ON DELETE CASCADE,
  tagId TEXT NOT NULL REFERENCES Tag(id) ON DELETE CASCADE,
  PRIMARY KEY (taskId, tagId)
);

CREATE TABLE IF NOT EXISTS Attachment (
  id TEXT PRIMARY KEY,
  taskId TEXT REFERENCES Task(id) ON DELETE CASCADE,
  noteId TEXT REFERENCES Note(id) ON DELETE CASCADE,
  fileName TEXT NOT NULL,
  fileType TEXT,
  fileSize INTEGER,
  createdAt TEXT NOT NULL
);

-- ==================== HABITS ====================

CREATE TABLE IF NOT EXISTS Habit (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES User(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '✅',
  color TEXT DEFAULT '#10B981',
  category TEXT,
  frequency TEXT DEFAULT 'daily', -- daily | weekly | custom
  targetPerWeek INTEGER DEFAULT 7,
  reminderTime TEXT,
  goalId TEXT REFERENCES Goal(id) ON DELETE SET NULL,
  archived INTEGER DEFAULT 0,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS HabitLog (
  id TEXT PRIMARY KEY,
  habitId TEXT NOT NULL REFERENCES Habit(id) ON DELETE CASCADE,
  date TEXT NOT NULL, -- yyyy-mm-dd
  completed INTEGER DEFAULT 1,
  note TEXT,
  createdAt TEXT NOT NULL,
  UNIQUE(habitId, date)
);

-- ==================== GOALS ====================

CREATE TABLE IF NOT EXISTS Goal (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES User(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  term TEXT DEFAULT 'short', -- short | medium | long
  category TEXT,
  targetDate TEXT,
  progress INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active', -- active | completed | abandoned
  notes TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS GoalMilestone (
  id TEXT PRIMARY KEY,
  goalId TEXT NOT NULL REFERENCES Goal(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed INTEGER DEFAULT 0,
  dueDate TEXT,
  orderIndex INTEGER DEFAULT 0,
  createdAt TEXT NOT NULL
);

-- ==================== CALENDAR ====================

CREATE TABLE IF NOT EXISTS CalendarEvent (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES User(id) ON DELETE CASCADE,
  taskId TEXT REFERENCES Task(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  date TEXT NOT NULL,
  startTime TEXT NOT NULL,
  endTime TEXT NOT NULL,
  color TEXT DEFAULT '#7C3AED',
  location TEXT,
  repeatRule TEXT,
  allDay INTEGER DEFAULT 0,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS Reminder (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES User(id) ON DELETE CASCADE,
  taskId TEXT REFERENCES Task(id) ON DELETE CASCADE,
  habitId TEXT REFERENCES Habit(id) ON DELETE CASCADE,
  goalId TEXT REFERENCES Goal(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'task', -- task | habit | goal | morning_briefing | evening_review | custom
  message TEXT,
  triggerAt TEXT NOT NULL,
  recurring TEXT, -- JSON rule
  dismissed INTEGER DEFAULT 0,
  createdAt TEXT NOT NULL
);

-- ==================== NOTES ====================

CREATE TABLE IF NOT EXISTS Note (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES User(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT, -- markdown
  type TEXT DEFAULT 'note', -- note | checklist
  taskId TEXT REFERENCES Task(id) ON DELETE SET NULL,
  projectId TEXT REFERENCES Project(id) ON DELETE SET NULL,
  goalId TEXT REFERENCES Goal(id) ON DELETE SET NULL,
  pinned INTEGER DEFAULT 0,
  favorite INTEGER DEFAULT 0,
  color TEXT DEFAULT '#FFFFFF',
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS NoteTag (
  noteId TEXT NOT NULL REFERENCES Note(id) ON DELETE CASCADE,
  tagId TEXT NOT NULL REFERENCES Tag(id) ON DELETE CASCADE,
  PRIMARY KEY (noteId, tagId)
);

-- ==================== JOURNAL ====================

CREATE TABLE IF NOT EXISTS Journal (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES User(id) ON DELETE CASCADE,
  date TEXT NOT NULL, -- yyyy-mm-dd
  whatHappened TEXT,
  accomplishments TEXT,
  wentWell TEXT,
  wentWrong TEXT,
  improvements TEXT,
  tomorrowPriorities TEXT,
  mood TEXT, -- great | good | okay | bad | rough
  aiSummary TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  UNIQUE(userId, date)
);

-- ==================== FOCUS SESSIONS ====================

CREATE TABLE IF NOT EXISTS FocusSession (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES User(id) ON DELETE CASCADE,
  taskId TEXT REFERENCES Task(id) ON DELETE SET NULL,
  mode TEXT DEFAULT 'pomodoro', -- pomodoro | custom | deep_work
  plannedMinutes INTEGER NOT NULL,
  actualMinutes INTEGER,
  startedAt TEXT NOT NULL,
  endedAt TEXT,
  completed INTEGER DEFAULT 0,
  interrupted INTEGER DEFAULT 0,
  createdAt TEXT NOT NULL
);

-- ==================== PRODUCTIVITY & GAMIFICATION ====================

CREATE TABLE IF NOT EXISTS ProductivityScore (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES User(id) ON DELETE CASCADE,
  date TEXT NOT NULL, -- yyyy-mm-dd
  score INTEGER NOT NULL,
  taskCompletionPct INTEGER,
  focusPct INTEGER,
  habitPct INTEGER,
  goalPct INTEGER,
  consistencyPct INTEGER,
  breakdown TEXT, -- JSON explanation
  createdAt TEXT NOT NULL,
  UNIQUE(userId, date)
);

CREATE TABLE IF NOT EXISTS GamificationProfile (
  id TEXT PRIMARY KEY,
  userId TEXT UNIQUE NOT NULL REFERENCES User(id) ON DELETE CASCADE,
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  currentStreak INTEGER DEFAULT 0,
  bestStreak INTEGER DEFAULT 0,
  lastActiveDate TEXT,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS Badge (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES User(id) ON DELETE CASCADE,
  key TEXT NOT NULL, -- e.g. 'streak_7', 'tasks_100'
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '🏆',
  earnedAt TEXT NOT NULL,
  UNIQUE(userId, key)
);

-- ==================== NOTIFICATIONS ====================

CREATE TABLE IF NOT EXISTS Notification (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES User(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- task_due | habit_streak | task_overdue | goal_milestone | weekly_report | ai_recommendation | badge
  title TEXT NOT NULL,
  message TEXT,
  icon TEXT DEFAULT '🔔',
  link TEXT,
  read INTEGER DEFAULT 0,
  createdAt TEXT NOT NULL
);

-- ==================== AI ====================

CREATE TABLE IF NOT EXISTS AIInteraction (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES User(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- user | assistant
  content TEXT NOT NULL,
  actionsJson TEXT, -- JSON of actions AI took (created tasks etc.)
  createdAt TEXT NOT NULL
);

-- ==================== ACTIVITY LOG ====================

CREATE TABLE IF NOT EXISTS ActivityLog (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES User(id) ON DELETE CASCADE,
  entityType TEXT NOT NULL, -- task | habit | goal | project | note | focus
  entityId TEXT,
  action TEXT NOT NULL, -- created | updated | completed | deleted | rescheduled
  detail TEXT,
  createdAt TEXT NOT NULL
);

-- ==================== INDEXES ====================

CREATE INDEX IF NOT EXISTS idx_task_user_date ON Task(userId, date);
CREATE INDEX IF NOT EXISTS idx_task_project ON Task(projectId);
CREATE INDEX IF NOT EXISTS idx_task_parent ON Task(parentTaskId);
CREATE INDEX IF NOT EXISTS idx_task_status ON Task(userId, status);
CREATE INDEX IF NOT EXISTS idx_habitlog_habit_date ON HabitLog(habitId, date);
CREATE INDEX IF NOT EXISTS idx_calendarevent_user_date ON CalendarEvent(userId, date);
CREATE INDEX IF NOT EXISTS idx_note_user ON Note(userId);
CREATE INDEX IF NOT EXISTS idx_journal_user_date ON Journal(userId, date);
CREATE INDEX IF NOT EXISTS idx_focus_user ON FocusSession(userId, startedAt);
CREATE INDEX IF NOT EXISTS idx_notification_user ON Notification(userId, read);
CREATE INDEX IF NOT EXISTS idx_goal_user ON Goal(userId, term);
CREATE INDEX IF NOT EXISTS idx_activitylog_user ON ActivityLog(userId, createdAt);
