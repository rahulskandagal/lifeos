-- LifeOS — PostgreSQL schema (production reference)
--
-- LifeOS ships with a zero-config embedded SQLite database (Node's built-in
-- `node:sqlite`, see src/lib/db/schema.sql and src/lib/db/client.ts) so the
-- app runs with no external services for local development and demos.
--
-- This file is the PostgreSQL-equivalent schema for production deployment.
-- To switch the app to Postgres:
--   1. Run this file against your Postgres database.
--   2. Replace src/lib/db/client.ts with a `pg` Pool (or an ORM of choice)
--      that exposes the same query surface the repositories under
--      src/lib/db/repositories/* expect (parameterized SQL, synchronous
--      call sites become async — update repositories accordingly).
--   3. Set DATABASE_URL in your environment.
-- The repositories are the ONLY layer that talks to the database client, so
-- this is a contained migration rather than an app-wide rewrite.

CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- for gen_random_uuid()

CREATE TABLE "User" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'system',
  accent_color TEXT DEFAULT 'violet',
  language TEXT DEFAULT 'en',
  working_hours_start TEXT DEFAULT '09:00',
  working_hours_end TEXT DEFAULT '18:00',
  productive_hours_start TEXT DEFAULT '09:00',
  productive_hours_end TEXT DEFAULT '12:00',
  daily_focus_goal_minutes INT DEFAULT 120,
  daily_task_goal INT DEFAULT 5,
  notify_task_due BOOLEAN DEFAULT TRUE,
  notify_habit BOOLEAN DEFAULT TRUE,
  notify_goal_milestone BOOLEAN DEFAULT TRUE,
  notify_morning_briefing BOOLEAN DEFAULT TRUE,
  notify_evening_review BOOLEAN DEFAULT TRUE,
  ai_auto_prioritize BOOLEAN DEFAULT TRUE,
  ai_auto_breakdown BOOLEAN DEFAULT TRUE,
  ai_proactive_insights BOOLEAN DEFAULT TRUE,
  pomodoro_focus_min INT DEFAULT 25,
  pomodoro_break_min INT DEFAULT 5,
  pomodoro_long_break_min INT DEFAULT 15,
  week_starts_on INT DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE category (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '📁',
  color TEXT DEFAULT '#7C3AED',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE tag (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#64748B',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

CREATE TABLE project (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  status TEXT DEFAULT 'active',
  deadline DATE,
  progress INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE project_member (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES project(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  role TEXT DEFAULT 'member',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE project_milestone (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES project(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  due_date DATE,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE task (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  project_id UUID REFERENCES project(id) ON DELETE SET NULL,
  parent_task_id UUID REFERENCES task(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'todo',
  kanban_column TEXT DEFAULT 'todo',
  priority TEXT DEFAULT 'medium',
  ai_priority_score INT,
  category TEXT,
  date DATE,
  start_time TEXT,
  end_time TEXT,
  estimated_minutes INT,
  actual_minutes INT,
  location TEXT,
  reminder_minutes_before INT,
  repeat_rule JSONB,
  notes TEXT,
  energy_level TEXT,
  postpone_count INT DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE task_dependency (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES task(id) ON DELETE CASCADE,
  depends_on_task_id UUID NOT NULL REFERENCES task(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(task_id, depends_on_task_id)
);

CREATE TABLE task_tag (
  task_id UUID NOT NULL REFERENCES task(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tag(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, tag_id)
);

CREATE TABLE attachment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES task(id) ON DELETE CASCADE,
  note_id UUID,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE goal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  term TEXT DEFAULT 'short',
  category TEXT,
  target_date DATE,
  progress INT DEFAULT 0,
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE goal_milestone (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES goal(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  due_date DATE,
  order_index INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE habit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '✅',
  color TEXT DEFAULT '#10B981',
  category TEXT,
  frequency TEXT DEFAULT 'daily',
  target_per_week INT DEFAULT 7,
  reminder_time TEXT,
  goal_id UUID REFERENCES goal(id) ON DELETE SET NULL,
  archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE habit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES habit(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  completed BOOLEAN DEFAULT TRUE,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(habit_id, date)
);

CREATE TABLE calendar_event (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  task_id UUID REFERENCES task(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  color TEXT DEFAULT '#7C3AED',
  location TEXT,
  repeat_rule JSONB,
  all_day BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE reminder (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  task_id UUID REFERENCES task(id) ON DELETE CASCADE,
  habit_id UUID REFERENCES habit(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES goal(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'task',
  message TEXT,
  trigger_at TIMESTAMPTZ NOT NULL,
  recurring JSONB,
  dismissed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE note (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  type TEXT DEFAULT 'note',
  task_id UUID REFERENCES task(id) ON DELETE SET NULL,
  project_id UUID REFERENCES project(id) ON DELETE SET NULL,
  goal_id UUID REFERENCES goal(id) ON DELETE SET NULL,
  pinned BOOLEAN DEFAULT FALSE,
  favorite BOOLEAN DEFAULT FALSE,
  color TEXT DEFAULT '#FFFFFF',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE note_tag (
  note_id UUID NOT NULL REFERENCES note(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tag(id) ON DELETE CASCADE,
  PRIMARY KEY (note_id, tag_id)
);

CREATE TABLE journal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  what_happened TEXT,
  accomplishments TEXT,
  went_well TEXT,
  went_wrong TEXT,
  improvements TEXT,
  tomorrow_priorities TEXT,
  mood TEXT,
  ai_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

CREATE TABLE focus_session (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  task_id UUID REFERENCES task(id) ON DELETE SET NULL,
  mode TEXT DEFAULT 'pomodoro',
  planned_minutes INT NOT NULL,
  actual_minutes INT,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  completed BOOLEAN DEFAULT FALSE,
  interrupted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE productivity_score (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  score INT NOT NULL,
  task_completion_pct INT,
  focus_pct INT,
  habit_pct INT,
  goal_pct INT,
  consistency_pct INT,
  breakdown JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

CREATE TABLE gamification_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  xp INT DEFAULT 0,
  level INT DEFAULT 1,
  current_streak INT DEFAULT 0,
  best_streak INT DEFAULT 0,
  last_active_date DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE badge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '🏆',
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, key)
);

CREATE TABLE notification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  icon TEXT DEFAULT '🔔',
  link TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE ai_interaction (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  actions_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  action TEXT NOT NULL,
  detail TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_task_user_date ON task(user_id, date);
CREATE INDEX idx_task_project ON task(project_id);
CREATE INDEX idx_task_parent ON task(parent_task_id);
CREATE INDEX idx_task_status ON task(user_id, status);
CREATE INDEX idx_habitlog_habit_date ON habit_log(habit_id, date);
CREATE INDEX idx_calendarevent_user_date ON calendar_event(user_id, date);
CREATE INDEX idx_note_user ON note(user_id);
CREATE INDEX idx_journal_user_date ON journal(user_id, date);
CREATE INDEX idx_focus_user ON focus_session(user_id, started_at);
CREATE INDEX idx_notification_user ON notification(user_id, read);
CREATE INDEX idx_goal_user ON goal(user_id, term);
CREATE INDEX idx_activitylog_user ON activity_log(user_id, created_at);
