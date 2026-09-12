# Feature coverage

LifeOS implements the full feature surface as a working product. This
file is an honest map of what's fully functional, what's intentionally
simplified, and what's a placeholder — so nothing is oversold.

## Fully functional

- **Auth**: email/password with bcrypt hashing, NextAuth v5 JWT sessions, protected routes.
- **Dashboard**: greeting, live clock, date, weather (real, if `WEATHER_API_KEY` set), rotating motivational message, productivity score with breakdown, tasks completed/remaining, streak, focus time, today's tasks, AI daily plan, habits/goals/insights widgets.
- **Tasks**: full CRUD, natural-language quick add (chrono-node powered), subtasks, dependencies, recurrence field, tags, categories, priorities + AI priority score, list view (grouped by date) and Kanban board (drag-and-drop via dnd-kit), filters (today/tomorrow/upcoming/overdue/completed/priority/category), complete/edit/delete/snooze/duplicate/change-priority actions.
- **Calendar**: Day/Week/Month/Year views, drag-and-drop rescheduling in Month view, time-grid Week/Day views, conflict detection on event creation, Year view heatmap.
- **Habits**: CRUD, daily check-off, current/best streak computed from real logs, 30-day heatmap, success percentage.
- **Goals**: short/medium/long-term, milestones with progress rollup, linked category.
- **Projects**: CRUD, members, milestones, List/Kanban/Timeline views per project.
- **Focus mode**: Pomodoro + custom timer, session persistence, today/week/month stats, fullscreen mode, session history.
- **Analytics**: real charts (Recharts) from actual data — completion trend, category breakdown, hour-of-day and day-of-week productivity, habit success, goal progress, streak/level/XP.
- **AI**: natural-language task parsing, rule-based task breakdown (project/study/event/writing templates), priority scoring formula, auto day-planner (greedy scheduler respecting fixed events + breaks + productive hours), insight generation from real history, chat assistant that executes real actions (create/reschedule/breakdown tasks, plan day, summarize progress) — see `src/lib/ai/`.
- **Notes**: markdown content, pin/favorite, search, linkable to tasks/projects/goals (schema supports it; UI links can be extended).
- **Journal**: daily structured entries, mood, AI summary (rule-based text synthesis), history browser.
- **Notifications**: in-app notification center, unread badge, mark read/all-read; seeded with realistic examples.
- **Gamification**: XP, levels, streaks, badges (auto-awarded on milestones like 100 tasks / 7-day streak / goal completed).
- **Settings**: account, appearance (theme + accent), notifications, AI preferences, productivity (working/productive hours, pomodoro lengths), calendar, data export/import, privacy.
- **Data export/import**: CSV & JSON export for tasks/habits/goals/projects/notes; CSV/JSON task import.
- **Command palette** (`Ctrl/Cmd+K`), **keyboard shortcuts** (N/F/C/H/G/A//), **quick-add FAB**.
- **PWA**: manifest, service worker (app-shell caching), installable, offline task/habit creation queued via IndexedDB and synced on reconnect.
- **Responsive**: sidebar (desktop) / bottom nav (mobile), touch-friendly throughout.
- **Themes**: light/dark/system via next-themes + CSS custom properties.
- **Accessibility**: Radix primitives (Dialog, DropdownMenu, Tabs, Switch) for keyboard nav + ARIA out of the box, visible focus rings, semantic labels on icon-only buttons.

## Intentionally simplified

- **Attachments**: schema + API surface exist (`Attachment` table); no file upload UI is wired up yet — the pieces are in place for adding one.
- **Task dependency visualization**: dependencies are stored and enforced at the data level; the UI shows a plain list rather than a graph diagram.
- **Recurring tasks/events**: `repeatRule` (JSON) is stored on Task/CalendarEvent, but the recurrence-expansion engine (auto-generating future instances) isn't implemented — a task marked "every Monday" stores that rule but won't auto-clone itself yet.
- **Push notifications**: the in-app notification center is fully real; browser/OS push notifications are not wired (would need a push service + user permission flow).

## Placeholders, by design (see `src/lib/integrations/`)

Per the brief's "do not fake integrations" instruction, these are clean
interfaces with stub implementations that report "not connected" rather
than synced data: Google Calendar, Outlook Calendar, Google Tasks,
Notion, Todoist, WhatsApp, Telegram bot, browser extension, desktop/mobile
apps, voice input, wearable/health data, geofencing, team collaboration.
