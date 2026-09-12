// Integration interfaces (section 49) — LifeOS defines the contract each
// future connector must satisfy so the rest of the app (task creation,
// calendar sync, notifications) never needs to know which provider is
// behind it. Nothing here fabricates data: an unconfigured provider should
// throw IntegrationNotConfiguredError, and callers surface that as a clean
// "connect your account" prompt rather than fake synced content.

export class IntegrationNotConfiguredError extends Error {
  constructor(provider: string) {
    super(`${provider} is not configured. Add credentials in Settings → Integrations.`);
    this.name = "IntegrationNotConfiguredError";
  }
}

export interface ExternalCalendarEvent {
  externalId: string;
  title: string;
  description?: string;
  date: string; // yyyy-mm-dd
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  location?: string;
}

/** Implemented by: Google Calendar, Outlook Calendar */
export interface CalendarProvider {
  readonly name: string;
  isConfigured(): boolean;
  listEvents(userId: string, from: string, to: string): Promise<ExternalCalendarEvent[]>;
  createEvent(userId: string, event: Omit<ExternalCalendarEvent, "externalId">): Promise<ExternalCalendarEvent>;
  deleteEvent(userId: string, externalId: string): Promise<void>;
}

export interface ExternalTask {
  externalId: string;
  title: string;
  notes?: string;
  dueDate?: string;
  completed: boolean;
}

/** Implemented by: Google Tasks, Todoist, Notion */
export interface TaskProvider {
  readonly name: string;
  isConfigured(): boolean;
  listTasks(userId: string): Promise<ExternalTask[]>;
  createTask(userId: string, task: Omit<ExternalTask, "externalId" | "completed">): Promise<ExternalTask>;
  completeTask(userId: string, externalId: string): Promise<void>;
}

/** Implemented by: WhatsApp Business API, Telegram Bot API */
export interface MessagingProvider {
  readonly name: string;
  isConfigured(): boolean;
  /** Parses an inbound message into a task-creation request (natural language). */
  parseInboundMessage(userId: string, text: string): Promise<{ title: string; date?: string; startTime?: string }>;
  sendMessage(userId: string, text: string): Promise<void>;
}
