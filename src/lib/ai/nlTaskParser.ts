import * as chrono from "chrono-node";
import { DEFAULT_CATEGORIES } from "@/types";

export interface ParsedTask {
  title: string;
  date?: string; // yyyy-mm-dd
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  estimatedMinutes?: number;
  category?: string;
  priority?: "critical" | "high" | "medium" | "low";
  reminderMinutesBefore?: number;
  location?: string;
  tags?: string[];
}

const DURATION_RE = /\bfor\s+(\d+(?:\.\d+)?)\s*(hours?|hrs?|h|minutes?|mins?|m)\b/i;
const REMINDER_RE = /\bremind(?:\s+me)?\s+(\d+)\s*(minutes?|mins?|hours?|hrs?)\s+before\b/i;
const LOCATION_RE = /\bat\s+the\s+([a-zA-Z\s]+?)(?:\.|,|$)/i;

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Study: ["study", "exam", "revise", "homework", "assignment", "dbms", "class", "lecture", "read chapter"],
  Work: ["work", "meeting", "client", "report", "email", "project", "presentation", "standup", "call"],
  Fitness: ["gym", "workout", "exercise", "run", "jog", "yoga", "swim", "cycling"],
  Personal: ["clean", "chore", "personal", "errand", "appointment"],
  Finance: ["pay", "bill", "budget", "invoice", "tax", "bank"],
  Shopping: ["buy", "shop", "purchase", "groceries", "order"],
  Family: ["family", "mom", "dad", "kids", "parents", "spouse"],
  Goals: ["goal", "milestone"],
  Learning: ["learn", "course", "tutorial", "practice", "book"],
  Ideas: ["idea", "brainstorm", "sketch"],
};

const PRIORITY_KEYWORDS: Record<string, "critical" | "high" | "medium" | "low"> = {
  urgent: "critical",
  asap: "critical",
  critical: "critical",
  important: "high",
  high: "high",
  low: "low",
  "whenever": "low",
};

function detectCategory(text: string): string | undefined {
  const lower = text.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) return category;
  }
  return undefined;
}

function detectPriority(text: string): "critical" | "high" | "medium" | "low" | undefined {
  const lower = text.toLowerCase();
  for (const [kw, priority] of Object.entries(PRIORITY_KEYWORDS)) {
    if (lower.includes(kw)) return priority;
  }
  return undefined;
}

function detectTags(text: string): string[] {
  const matches = text.match(/#(\w+)/g);
  return matches ? matches.map((m) => m.slice(1)) : [];
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

/**
 * Parses natural-language task input like:
 *   "Tomorrow at 7 PM study DBMS for 2 hours"
 *   "Submit report by Friday 5pm, remind me 15 minutes before #work"
 * into a structured task draft. Fully deterministic, no external AI call
 * required — this keeps "Quick add" instant and offline-capable.
 */
export function parseNaturalLanguageTask(input: string, referenceDate: Date = new Date()): ParsedTask {
  let text = input.trim();

  const tags = detectTags(text);
  text = text.replace(/#\w+/g, "").trim();

  let estimatedMinutes: number | undefined;
  const durationMatch = text.match(DURATION_RE);
  if (durationMatch) {
    const value = parseFloat(durationMatch[1]);
    const unit = durationMatch[2].toLowerCase();
    estimatedMinutes = unit.startsWith("h") ? Math.round(value * 60) : Math.round(value);
    text = text.replace(DURATION_RE, "").trim();
  }

  let reminderMinutesBefore: number | undefined;
  const reminderMatch = text.match(REMINDER_RE);
  if (reminderMatch) {
    const value = parseInt(reminderMatch[1], 10);
    const unit = reminderMatch[2].toLowerCase();
    reminderMinutesBefore = unit.startsWith("h") ? value * 60 : value;
    text = text.replace(REMINDER_RE, "").trim();
  }

  let location: string | undefined;
  const locationMatch = text.match(LOCATION_RE);
  if (locationMatch) {
    location = locationMatch[1].trim();
  }

  const priority = detectPriority(text);
  const category = detectCategory(text);

  const chronoResults = chrono.parse(text, referenceDate, { forwardDate: true });
  let date: string | undefined;
  let startTime: string | undefined;
  let endTime: string | undefined;
  let cleanedTitle = text;

  if (chronoResults.length > 0) {
    const result = chronoResults[0];
    const start = result.start.date();
    date = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`;
    if (result.start.isCertain("hour")) {
      startTime = `${pad(start.getHours())}:${pad(start.getMinutes())}`;
      if (estimatedMinutes) {
        const end = new Date(start.getTime() + estimatedMinutes * 60000);
        endTime = `${pad(end.getHours())}:${pad(end.getMinutes())}`;
      }
    }
    if (result.end) {
      const end = result.end.date();
      endTime = `${pad(end.getHours())}:${pad(end.getMinutes())}`;
    }
    cleanedTitle = (text.slice(0, result.index) + text.slice(result.index + result.text.length)).trim();
  }

  // Clean up leftover connector words
  cleanedTitle = cleanedTitle
    .replace(/^(to|and)\s+/i, "")
    .replace(/\s{2,}/g, " ")
    .replace(/[,]+$/, "")
    .replace(/^\s*[-–]\s*/, "")
    .trim();

  cleanedTitle = cleanedTitle.charAt(0).toUpperCase() + cleanedTitle.slice(1);

  return {
    title: cleanedTitle || input.trim(),
    date,
    startTime,
    endTime,
    estimatedMinutes,
    category: category ?? DEFAULT_CATEGORIES.find((c) => c.name === "Personal")?.name,
    priority,
    reminderMinutesBefore,
    location,
    tags: tags.length ? tags : undefined,
  };
}
