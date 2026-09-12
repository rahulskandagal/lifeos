"use client";

import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { BottomNav } from "./BottomNav";
import { CommandPalette } from "./CommandPalette";
import { QuickAddFAB } from "./QuickAddFAB";
import { TaskModal } from "@/components/tasks/TaskModal";
import { HabitModal } from "@/components/habits/HabitModal";
import { GoalModal } from "@/components/goals/GoalModal";
import { NoteModal } from "@/components/notes/NoteModal";
import { ProjectModal } from "@/components/projects/ProjectModal";
import { EventModal } from "@/components/calendar/EventModal";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

export function AppShell({ children }: { children: React.ReactNode }) {
  useKeyboardShortcuts();

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 pb-24 md:pb-8">{children}</main>
      </div>
      <BottomNav />
      <QuickAddFAB />
      <CommandPalette />
      <TaskModal />
      <HabitModal />
      <GoalModal />
      <NoteModal />
      <ProjectModal />
      <EventModal />
    </div>
  );
}
