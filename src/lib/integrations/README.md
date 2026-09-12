# Integrations

LifeOS is architected so third-party connectors can be added without
touching core task/calendar/habit logic. Each provider implements one of
the small interfaces in [`types.ts`](./types.ts):

- `CalendarProvider` — Google Calendar, Outlook Calendar
- `TaskProvider` — Google Tasks, Todoist, Notion
- `MessagingProvider` — WhatsApp, Telegram (inbound "create task" messages)

[`googleCalendar.ts`](./googleCalendar.ts) and [`todoist.ts`](./todoist.ts)
are reference stubs: they satisfy the interface, report
`isConfigured() === false` until credentials are present in the
environment, and throw `IntegrationNotConfiguredError` for every method
otherwise. **Nothing here fabricates synced data** — the Settings →
Integrations tab shows these as "Coming soon" until real credentials and
API calls are wired in.

## Adding a new provider

1. Create `src/lib/integrations/<provider>.ts` implementing the relevant
   interface.
2. Store any OAuth tokens / API keys per-user (a new `integration_credentials`
   table, or environment variables for a single-tenant deployment).
3. Wire calls into the existing repositories (`src/lib/db/repositories/*`)
   so synced items become normal Tasks/CalendarEvents — the rest of the UI
   (dashboard, analytics, AI assistant) then works with them automatically.
4. Add a sync trigger: a scheduled job, a webhook route under
   `src/app/api/integrations/<provider>/webhook`, or a manual "Sync now"
   button in Settings.

## Other future integrations (section 49 of the spec)

Voice task creation, wearable/health data, geofenced reminders, and team
collaboration are intentionally left as UI/data-model placeholders (the
`ProjectMember` table already supports multiple people per project) rather
than stubbed service files, since they need product decisions (permissions
model, device APIs) before an interface makes sense.
