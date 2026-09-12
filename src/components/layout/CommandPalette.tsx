"use client";

import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useUIStore } from "@/lib/store/uiStore";
import { NAV_ITEMS } from "@/lib/navigation";
import { apiFetch } from "@/lib/apiClient";
import type { Task, Note } from "@/types";
import { CheckSquare, Sparkles, Calendar, Target, Timer, Plus, Search } from "lucide-react";
import { toast } from "sonner";

export function CommandPalette() {
  const open = useUIStore((s) => s.commandPaletteOpen);
  const setOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const openTaskModal = useUIStore((s) => s.openTaskModal);
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [taskResults, setTaskResults] = useState<Task[]>([]);
  const [noteResults, setNoteResults] = useState<Note[]>([]);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!open);
      }
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, setOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setTaskResults([]);
      setNoteResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      try {
        const [tasksRes, notesRes] = await Promise.all([
          apiFetch<{ tasks: Task[] }>(`/api/tasks?search=${encodeURIComponent(query)}&topLevelOnly=false`),
          apiFetch<{ notes: Note[] }>(`/api/notes?search=${encodeURIComponent(query)}`),
        ]);
        setTaskResults(tasksRes.tasks.slice(0, 5));
        setNoteResults(notesRes.notes.slice(0, 5));
      } catch {
        /* ignore */
      }
    }, 200);
    return () => clearTimeout(timeout);
  }, [query]);

  function go(href: string) {
    router.push(href);
    setOpen(false);
    setQuery("");
  }

  async function planMyDay() {
    setOpen(false);
    toast.promise(apiFetch("/api/ai/plan-day", { method: "POST", body: JSON.stringify({}) }), {
      loading: "Planning your day…",
      success: "Day plan generated — check your Dashboard.",
      error: "Couldn't plan your day.",
    });
    router.push("/dashboard");
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[12vh] px-4" onClick={() => setOpen(false)}>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
      <Command
        className="relative w-full max-w-xl rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
        shouldFilter={false}
      >
        <div className="flex items-center gap-2 px-4 border-b border-border">
          <Search className="h-4 w-4 text-muted" />
          <Command.Input
            autoFocus
            value={query}
            onValueChange={setQuery}
            placeholder="Type a command or search…"
            className="flex-1 h-12 bg-transparent outline-none text-sm placeholder:text-muted"
          />
          <kbd className="text-[10px] text-muted border border-border rounded px-1.5 py-0.5">Esc</kbd>
        </div>
        <Command.List className="max-h-96 overflow-y-auto p-2">
          <Command.Empty className="py-8 text-center text-sm text-muted">No results found.</Command.Empty>

          {!query && (
            <Command.Group heading="Quick actions" className="text-xs text-muted px-2 py-1.5 [&_[cmdk-group-heading]]:mb-1">
              <PaletteItem icon={Plus} label="Create task" onSelect={() => { setOpen(false); openTaskModal(); }} />
              <PaletteItem icon={Sparkles} label="Plan my day" onSelect={planMyDay} />
              <PaletteItem icon={CheckSquare} label="Show today's tasks" onSelect={() => go("/tasks?filter=today")} />
              <PaletteItem icon={Target} label="Add habit" onSelect={() => go("/habits?new=1")} />
              <PaletteItem icon={Calendar} label="Open calendar" onSelect={() => go("/calendar")} />
              <PaletteItem icon={Timer} label="Start focus session" onSelect={() => go("/focus")} />
            </Command.Group>
          )}

          {!query && (
            <Command.Group heading="Navigate" className="text-xs text-muted px-2 py-1.5 [&_[cmdk-group-heading]]:mb-1">
              {NAV_ITEMS.map((item) => (
                <PaletteItem key={item.href} icon={item.icon} label={item.label} onSelect={() => go(item.href)} />
              ))}
            </Command.Group>
          )}

          {!!taskResults.length && (
            <Command.Group heading="Tasks" className="text-xs text-muted px-2 py-1.5 [&_[cmdk-group-heading]]:mb-1">
              {taskResults.map((t) => (
                <PaletteItem key={t.id} icon={CheckSquare} label={t.title} onSelect={() => go(`/tasks?open=${t.id}`)} />
              ))}
            </Command.Group>
          )}

          {!!noteResults.length && (
            <Command.Group heading="Notes" className="text-xs text-muted px-2 py-1.5 [&_[cmdk-group-heading]]:mb-1">
              {noteResults.map((n) => (
                <PaletteItem key={n.id} icon={Search} label={n.title} onSelect={() => go(`/notes?open=${n.id}`)} />
              ))}
            </Command.Group>
          )}
        </Command.List>
      </Command>
    </div>
  );
}

function PaletteItem({ icon: Icon, label, onSelect }: { icon: any; label: string; onSelect: () => void }) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm cursor-pointer data-[selected=true]:bg-accent/10 data-[selected=true]:text-accent outline-none"
    >
      <Icon className="h-4 w-4" />
      <span className="truncate">{label}</span>
    </Command.Item>
  );
}
