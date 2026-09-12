"use client";

import useSWR from "swr";
import { fetcher, apiMutate } from "@/lib/apiClient";
import { EmptyState, Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import type { Notification } from "@/types";
import { cn } from "@/lib/utils/cn";

export default function NotificationsPage() {
  const { data, isLoading, mutate } = useSWR<{ notifications: Notification[] }>("/api/notifications", fetcher);
  const notifications = data?.notifications ?? [];

  async function markRead(id: string) {
    await apiMutate("/api/notifications", "POST", { action: "mark-read", id });
    mutate();
  }
  async function markAllRead() {
    await apiMutate("/api/notifications", "POST", { action: "mark-all-read" });
    mutate();
  }

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
        {!!notifications.length && (
          <Button variant="secondary" size="sm" onClick={markAllRead}>
            Mark all as read
          </Button>
        )}
      </div>

      {isLoading && <Skeleton className="h-64 w-full" />}

      {!isLoading && !notifications.length && <EmptyState icon="🔔" title="You're all caught up" description="New notifications about tasks, habits, and goals will show up here." />}

      <div className="space-y-1.5">
        {notifications.map((n) => (
          <button
            key={n.id}
            onClick={() => !n.read && markRead(n.id)}
            className={cn("w-full text-left flex items-start gap-3 rounded-xl p-3 transition-colors", n.read ? "bg-transparent" : "bg-accent/5 hover:bg-accent/10")}
          >
            <span className="text-xl shrink-0">{n.icon}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{n.title}</p>
              {n.message && <p className="text-xs text-muted mt-0.5">{n.message}</p>}
              <p className="text-[10px] text-muted mt-1">{new Date(n.createdAt).toLocaleString()}</p>
            </div>
            {!n.read && <span className="h-2 w-2 rounded-full bg-accent shrink-0 mt-1.5" />}
          </button>
        ))}
      </div>
    </div>
  );
}
