import { IntegrationNotConfiguredError, type CalendarProvider, type ExternalCalendarEvent } from "./types";

// Stub implementation — wires up the CalendarProvider contract without any
// live Google API calls. To activate:
//   1. Create a Google Cloud project, enable the Calendar API, add OAuth
//      credentials, and set GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET.
//   2. Add a Google OAuth provider to src/lib/auth.ts (or a separate
//      connection flow under Settings → Integrations) to obtain a
//      refresh token per user, stored against UserSettings or a new
//      `integration_credentials` table.
//   3. Implement the methods below using `googleapis` (calendar.v3).
// Until then, isConfigured() returns false and every method throws
// IntegrationNotConfiguredError — the UI treats that as "not connected".
export const googleCalendarProvider: CalendarProvider = {
  name: "Google Calendar",

  isConfigured() {
    return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  },

  async listEvents(_userId: string, _from: string, _to: string): Promise<ExternalCalendarEvent[]> {
    if (!this.isConfigured()) throw new IntegrationNotConfiguredError(this.name);
    throw new Error("Not implemented — see file header for activation steps.");
  },

  async createEvent(_userId, _event) {
    if (!this.isConfigured()) throw new IntegrationNotConfiguredError(this.name);
    throw new Error("Not implemented — see file header for activation steps.");
  },

  async deleteEvent(_userId, _externalId) {
    if (!this.isConfigured()) throw new IntegrationNotConfiguredError(this.name);
    throw new Error("Not implemented — see file header for activation steps.");
  },
};
