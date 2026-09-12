import { IntegrationNotConfiguredError, type TaskProvider, type ExternalTask } from "./types";

// Stub implementation of the TaskProvider contract for Todoist.
// To activate: obtain a personal access token (or set up OAuth) from
// https://todoist.com/app/settings/integrations, store it per-user, and
// implement these methods against the Todoist REST API (`/rest/v2/tasks`).
export const todoistProvider: TaskProvider = {
  name: "Todoist",

  isConfigured() {
    return !!process.env.TODOIST_API_KEY;
  },

  async listTasks(_userId: string): Promise<ExternalTask[]> {
    if (!this.isConfigured()) throw new IntegrationNotConfiguredError(this.name);
    throw new Error("Not implemented — see file header for activation steps.");
  },

  async createTask(_userId, _task) {
    if (!this.isConfigured()) throw new IntegrationNotConfiguredError(this.name);
    throw new Error("Not implemented — see file header for activation steps.");
  },

  async completeTask(_userId, _externalId) {
    if (!this.isConfigured()) throw new IntegrationNotConfiguredError(this.name);
    throw new Error("Not implemented — see file header for activation steps.");
  },
};
