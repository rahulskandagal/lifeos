"use client";

import { Plus, CheckSquare, Repeat, Target, NotebookPen, FolderKanban, Calendar, BookOpen } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useUIStore } from "@/lib/store/uiStore";
import { useRouter } from "next/navigation";

export function QuickAddFAB() {
  const openTaskModal = useUIStore((s) => s.openTaskModal);
  const setHabitModalOpen = useUIStore((s) => s.setHabitModalOpen);
  const setGoalModalOpen = useUIStore((s) => s.setGoalModalOpen);
  const setNoteModalOpen = useUIStore((s) => s.setNoteModalOpen);
  const setProjectModalOpen = useUIStore((s) => s.setProjectModalOpen);
  const openEventModal = useUIStore((s) => s.openEventModal);
  const router = useRouter();

  const actions = [
    { label: "Task", icon: CheckSquare, onSelect: () => openTaskModal() },
    { label: "Habit", icon: Repeat, onSelect: () => setHabitModalOpen(true) },
    { label: "Goal", icon: Target, onSelect: () => setGoalModalOpen(true) },
    { label: "Note", icon: NotebookPen, onSelect: () => setNoteModalOpen(true) },
    { label: "Project", icon: FolderKanban, onSelect: () => setProjectModalOpen(true) },
    { label: "Event", icon: Calendar, onSelect: () => openEventModal() },
    { label: "Journal entry", icon: BookOpen, onSelect: () => router.push("/journal") },
  ];

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className="fixed z-40 right-5 bottom-20 md:bottom-6 h-14 w-14 rounded-full gradient-accent text-white shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform focus-ring"
          aria-label="Quick add"
        >
          <Plus className="h-6 w-6" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content side="top" align="end" sideOffset={12} className="min-w-48 rounded-xl border border-border bg-surface p-1 shadow-2xl z-50 animate-fade-in-up">
          {actions.map((a) => (
            <DropdownMenu.Item
              key={a.label}
              onSelect={a.onSelect}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm cursor-pointer hover:bg-surface-2 outline-none"
            >
              <a.icon className="h-4 w-4 text-accent" /> {a.label}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
