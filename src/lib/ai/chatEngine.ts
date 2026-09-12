import { TasksRepo, HabitsRepo, GoalsRepo, FocusRepo, UsersRepo } from "@/lib/db/repositories";
import { parseNaturalLanguageTask } from "./nlTaskParser";
import { breakdownTask } from "./taskBreakdown";
import { planDay } from "./dayPlanner";
import { generateInsights } from "./insights";
import { isAIProviderConfigured, callAIProvider } from "./provider";
import { CalendarRepo } from "@/lib/db/repositories";

export interface ChatAction {
  type: "created_task" | "created_tasks" | "rescheduled_task" | "completed_task" | "deleted_task" | "planned_day";
  detail: string;
}

export interface ChatResult {
  reply: string;
  actions: ChatAction[];
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Rule-based assistant engine. Understands a broad set of productivity
 * intents and executes real actions against the database (not canned
 * text) — creating tasks, breaking down projects, planning the day,
 * summarizing overdue items, and explaining productivity trends.
 *
 * If AI_API_KEY is configured, this is used as the deterministic fallback
 * / tool-executor: the LLM is asked to classify intent + extract
 * parameters, then this same execution logic runs.
 */
export async function handleChatMessage(userId: string, message: string): Promise<ChatResult> {
  const lower = message.toLowerCase().trim();
  const actions: ChatAction[] = [];

  // ---- Plan my day ----
  if (/plan (my|the) day|auto[- ]?plan|organize my day/.test(lower)) {
    const today = todayStr();
    const tasks = TasksRepo.listTasks(userId, { date: today });
    const habits = HabitsRepo.listHabits(userId);
    const events = CalendarRepo.listEvents(userId, today, today);
    const settings = UsersRepo.getUserSettings(userId);
    const blocks = planDay({ tasks, habits, fixedEvents: events, settings });
    actions.push({ type: "planned_day", detail: `${blocks.length} blocks scheduled` });
    const lines = blocks.map((b) => `${b.startTime}–${b.endTime}  ${blockIcon(b.type, b.icon)} ${b.title}`);
    return {
      reply: `Here's your optimized plan for today:\n\n${lines.join("\n")}\n\nYou can adjust anything on the Calendar or Dashboard.`,
      actions,
    };
  }

  // ---- What's overdue ----
  if (/overdue|missed|behind/.test(lower)) {
    const overdue = TasksRepo.listTasks(userId, { overdue: true });
    if (!overdue.length) return { reply: "Nothing overdue — you're fully caught up. 🎉", actions };
    const lines = overdue.map((t) => `• ${t.title} (was due ${t.date})`);
    return { reply: `You have ${overdue.length} overdue task(s):\n\n${lines.join("\n")}\n\nWant me to reschedule them to today?`, actions };
  }

  // ---- What should I do next ----
  if (/what should i do next|next task|what.?s next/.test(lower)) {
    const today = todayStr();
    const tasks = TasksRepo.listTasks(userId, { date: today, completed: false });
    if (!tasks.length) return { reply: "Your plate is clear for today — nice work! Want to plan tomorrow?", actions };
    const top = [...tasks].sort((a, b) => (b.aiPriorityScore ?? 0) - (a.aiPriorityScore ?? 0))[0];
    return { reply: `Focus on **${top.title}** next — it's your highest-priority item${top.startTime ? ` (scheduled ${top.startTime})` : ""}.`, actions };
  }

  // ---- Why was productivity low / analyze productivity ----
  if (/productivity|why (was|is) my|analy[sz]e/.test(lower)) {
    const from = new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10);
    const recentTasks = TasksRepo.listTasks(userId, { dateFrom: from, dateTo: todayStr() });
    const completed = recentTasks.filter((t) => t.status === "completed");
    const focusSessions = FocusRepo.listFocusSessions(userId, from, new Date().toISOString());
    const habits = HabitsRepo.listHabits(userId);
    const goals = GoalsRepo.listGoals(userId);
    const insights = generateInsights({ completedTasks: completed, allRecentTasks: recentTasks, focusSessions, habits, goals });
    return { reply: insights.map((i) => `${i.icon} ${i.text}`).join("\n"), actions };
  }

  // ---- Break down a project/task ----
  const breakdownMatch = lower.match(/break(?:\s+down)?\s+(?:this\s+)?(?:project\s+)?["“]?(.+?)["”]?\s*(?:into (?:tasks|subtasks))?$/);
  if (/break (this|it|down)|breakdown|split .* into/.test(lower) && breakdownMatch) {
    const title = message.replace(/break(?:\s+down)?|into (tasks|subtasks)/gi, "").trim() || breakdownMatch[1];
    const subtasks = breakdownTask(title);
    const parent = TasksRepo.createTask(userId, { title, priority: "high" });
    for (const s of subtasks) {
      const date = new Date(Date.now() + s.daysFromNow * 86400000).toISOString().slice(0, 10);
      TasksRepo.createTask(userId, { title: s.title, parentTaskId: parent.id, priority: s.priority, estimatedMinutes: s.estimatedMinutes, date });
    }
    actions.push({ type: "created_tasks", detail: `${subtasks.length} subtasks under "${title}"` });
    return {
      reply: `I broke "${title}" into ${subtasks.length} subtasks:\n\n${subtasks.map((s, i) => `${i + 1}. ${s.title} (~${s.estimatedMinutes}min, ${s.priority})`).join("\n")}`,
      actions,
    };
  }

  // ---- Create a study schedule / schedule for X ----
  if (/study schedule|create a schedule|schedule for/.test(lower)) {
    const topicMatch = message.match(/schedule (?:for|to study)\s+(.+)/i);
    const topic = topicMatch?.[1]?.trim() ?? "your subject";
    const subtasks = breakdownTask(`study ${topic}`);
    const created = subtasks.map((s, idx) => {
      const date = new Date(Date.now() + idx * 86400000).toISOString().slice(0, 10);
      return TasksRepo.createTask(userId, { title: `${s.title}: ${topic}`, priority: s.priority, estimatedMinutes: s.estimatedMinutes, date, category: "Study" });
    });
    actions.push({ type: "created_tasks", detail: `${created.length} study tasks for ${topic}` });
    return { reply: `Created a ${created.length}-day study schedule for ${topic}. Check your Tasks or Calendar view.`, actions };
  }

  // ---- Show progress this month / this week ----
  if (/progress (this|for) (month|week)|show my progress/.test(lower)) {
    const days = lower.includes("month") ? 30 : 7;
    const from = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
    const stats = TasksRepo.taskStats(userId, from, todayStr());
    const goals = GoalsRepo.listGoals(userId);
    const avgGoalProgress = goals.length ? Math.round(goals.reduce((s, g) => s + g.progress, 0) / goals.length) : 0;
    return {
      reply: `Over the last ${days} days: ${stats.completed}/${stats.total} tasks completed (${stats.total ? Math.round((stats.completed / stats.total) * 100) : 0}%), ${stats.overdue} overdue. Average goal progress: ${avgGoalProgress}%.`,
      actions,
    };
  }

  // ---- Create task (explicit or fallback) ----
  if (/^(create|add|new|remind me to|schedule)\b/.test(lower) || lower.length < 140) {
    const cleaned = message.replace(/^(create|add|new|remind me to|schedule)\s+(a\s+)?(task\s*[:-]?\s*)?/i, "");
    const parsed = parseNaturalLanguageTask(cleaned);
    if (parsed.title && parsed.title.length > 1 && (/^(create|add|new|remind me to|schedule)\b/.test(lower) || parsed.date || parsed.startTime)) {
      const task = TasksRepo.createTask(userId, {
        title: parsed.title,
        date: parsed.date,
        startTime: parsed.startTime,
        endTime: parsed.endTime,
        estimatedMinutes: parsed.estimatedMinutes,
        category: parsed.category,
        priority: parsed.priority ?? "medium",
        reminderMinutesBefore: parsed.reminderMinutesBefore,
        location: parsed.location,
        tags: parsed.tags,
      });
      actions.push({ type: "created_task", detail: task.title });
      return {
        reply: `Created task **"${task.title}"**${task.date ? ` on ${task.date}` : ""}${task.startTime ? ` at ${task.startTime}` : ""}${task.estimatedMinutes ? ` (~${task.estimatedMinutes} min)` : ""}.`,
        actions,
      };
    }
  }

  // ---- Fallback: summarize the day ----
  const today = todayStr();
  const tasks = TasksRepo.listTasks(userId, { date: today });
  const completed = tasks.filter((t) => t.status === "completed").length;
  return {
    reply: `I can help you plan your day, create and break down tasks, reschedule things, or analyze your productivity. Today you have ${tasks.length} task(s), ${completed} completed. Try: "Plan my day" or "Break down my final year project".`,
    actions,
  };
}

function blockIcon(type: string, icon?: string): string {
  if (icon) return icon;
  switch (type) {
    case "task":
      return "📌";
    case "habit":
      return "✅";
    case "break":
      return "☕";
    case "fixed":
      return "📅";
    default:
      return "•";
  }
}

/**
 * If an external AI provider is configured, this attempts to enrich the
 * reply with a more natural-language rewrite while keeping the same
 * underlying actions (which are always executed deterministically above,
 * never invented by the LLM). On any failure, the rule-based reply is used
 * as-is.
 */
export async function polishReply(reply: string): Promise<string> {
  if (!isAIProviderConfigured()) return reply;
  try {
    const polished = await callAIProvider([
      { role: "system", content: "You are LifeOS's productivity assistant. Rewrite the following message to be warm, concise, and well-formatted. Keep all facts, numbers, and task names exactly the same. Do not invent new information." },
      { role: "user", content: reply },
    ]);
    return polished?.trim() || reply;
  } catch {
    return reply;
  }
}
