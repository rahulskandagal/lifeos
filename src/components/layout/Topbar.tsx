"use client";

import { Search, Bell, Sun, Moon, Monitor, LogOut, Settings, Plus } from "lucide-react";
import { useTheme } from "next-themes";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import useSWR from "swr";
import { fetcher } from "@/lib/apiClient";
import { useUIStore } from "@/lib/store/uiStore";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils/cn";
import { useEffect, useState } from "react";

export function Topbar() {
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();
  const setCommandPaletteOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const openTaskModal = useUIStore((s) => s.openTaskModal);
  const { data } = useSWR<{ unreadCount: number }>("/api/notifications", fetcher, { refreshInterval: 60000 });
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const initials = (session?.user?.name ?? "U")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 glass h-16 flex items-center gap-3 px-4 md:px-6 border-b border-border">
      <button
        onClick={() => setCommandPaletteOpen(true)}
        className="flex-1 max-w-md flex items-center gap-2 h-10 rounded-xl border border-border bg-surface px-3 text-sm text-muted hover:border-accent/50 transition-colors focus-ring"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="truncate">Search tasks, notes, goals…</span>
        <kbd className="ml-auto hidden sm:inline-flex items-center gap-0.5 rounded border border-border bg-surface-2 px-1.5 py-0.5 text-[10px] font-mono text-muted">
          Ctrl K
        </kbd>
      </button>

      <button
        onClick={() => openTaskModal()}
        className="hidden sm:inline-flex items-center gap-1.5 h-10 px-3 rounded-xl gradient-accent text-white text-sm font-medium hover:opacity-90 transition-opacity focus-ring"
      >
        <Plus className="h-4 w-4" /> New
      </button>

      <div className="ml-auto flex items-center gap-1.5">
        {mounted && (
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="h-9 w-9 rounded-lg hover:bg-surface-2 flex items-center justify-center text-muted hover:text-foreground focus-ring" aria-label="Toggle theme">
                {theme === "dark" ? <Moon className="h-4.5 w-4.5" /> : theme === "light" ? <Sun className="h-4.5 w-4.5" /> : <Monitor className="h-4.5 w-4.5" />}
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content align="end" className="min-w-36 rounded-xl border border-border bg-surface p-1 shadow-xl z-50 animate-fade-in-up">
                {[
                  { key: "light", label: "Light", icon: Sun },
                  { key: "dark", label: "Dark", icon: Moon },
                  { key: "system", label: "System", icon: Monitor },
                ].map((opt) => (
                  <DropdownMenu.Item
                    key={opt.key}
                    onSelect={() => setTheme(opt.key)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm cursor-pointer hover:bg-surface-2 outline-none",
                      theme === opt.key && "text-accent"
                    )}
                  >
                    <opt.icon className="h-4 w-4" /> {opt.label}
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        )}

        <Link href="/notifications" className="relative h-9 w-9 rounded-lg hover:bg-surface-2 flex items-center justify-center text-muted hover:text-foreground focus-ring" aria-label="Notifications">
          <Bell className="h-4.5 w-4.5" />
          {!!data?.unreadCount && (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-danger ring-2 ring-surface" />
          )}
        </Link>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="h-9 w-9 rounded-full gradient-accent text-white text-xs font-semibold flex items-center justify-center focus-ring ml-1">
              {initials}
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content align="end" className="min-w-48 rounded-xl border border-border bg-surface p-1 shadow-xl z-50 animate-fade-in-up">
              <div className="px-2.5 py-2 text-sm">
                <p className="font-medium truncate">{session?.user?.name}</p>
                <p className="text-xs text-muted truncate">{session?.user?.email}</p>
              </div>
              <DropdownMenu.Separator className="h-px bg-border my-1" />
              <DropdownMenu.Item asChild>
                <Link href="/settings" className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm cursor-pointer hover:bg-surface-2 outline-none">
                  <Settings className="h-4 w-4" /> Settings
                </Link>
              </DropdownMenu.Item>
              <DropdownMenu.Item
                onSelect={() => signOut({ callbackUrl: "/login" })}
                className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm cursor-pointer hover:bg-surface-2 outline-none text-danger"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
}
