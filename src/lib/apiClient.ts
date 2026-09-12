import { toast } from "sonner";
import { queueMutation } from "@/lib/offlineQueue";

export class ApiError extends Error {}
export class NetworkOfflineError extends Error {}

export async function apiFetch<T = any>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json().catch(() => ({})) : await res.text();
  if (!res.ok) {
    const message = typeof data === "object" ? data?.error ?? "Something went wrong" : "Something went wrong";
    throw new ApiError(message);
  }
  return data as T;
}

export const fetcher = (url: string) => apiFetch(url);

export async function apiMutate<T = any>(url: string, method: "POST" | "PATCH" | "DELETE" | "PUT", body?: unknown): Promise<T> {
  try {
    return await apiFetch<T>(url, { method, body: body ? JSON.stringify(body) : undefined });
  } catch (err) {
    // Offline (fetch throws a TypeError, not our ApiError) — queue POST/PATCH
    // for tasks & habits so the UI keeps working without a connection.
    const offline = typeof navigator !== "undefined" && !navigator.onLine;
    const queueable = method !== "DELETE" && (url.startsWith("/api/tasks") || url.startsWith("/api/habits"));
    if (offline && queueable && !(err instanceof ApiError)) {
      await queueMutation(url, method, body);
      toast.info("You're offline — saved and will sync automatically.");
      throw new NetworkOfflineError("Queued for sync");
    }
    if (err instanceof ApiError) toast.error(err.message);
    throw err;
  }
}
