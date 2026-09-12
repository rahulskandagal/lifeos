import { create } from "zustand";
import type { Task } from "@/types";

interface UIState {
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (v: boolean) => void;

  taskModal: { open: boolean; task?: Task | null; initial?: Partial<Task & { parentTaskId?: string }> };
  openTaskModal: (opts?: { task?: Task | null; initial?: Partial<Task & { parentTaskId?: string }> }) => void;
  closeTaskModal: () => void;

  habitModalOpen: boolean;
  setHabitModalOpen: (v: boolean) => void;

  goalModalOpen: boolean;
  setGoalModalOpen: (v: boolean) => void;

  noteModalOpen: boolean;
  setNoteModalOpen: (v: boolean) => void;

  projectModalOpen: boolean;
  setProjectModalOpen: (v: boolean) => void;

  eventModal: { open: boolean; initial?: { date?: string; startTime?: string } };
  openEventModal: (initial?: { date?: string; startTime?: string }) => void;
  closeEventModal: () => void;

  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  commandPaletteOpen: false,
  setCommandPaletteOpen: (v) => set({ commandPaletteOpen: v }),

  taskModal: { open: false },
  openTaskModal: (opts) => set({ taskModal: { open: true, task: opts?.task ?? null, initial: opts?.initial } }),
  closeTaskModal: () => set({ taskModal: { open: false, task: null, initial: undefined } }),

  habitModalOpen: false,
  setHabitModalOpen: (v) => set({ habitModalOpen: v }),

  goalModalOpen: false,
  setGoalModalOpen: (v) => set({ goalModalOpen: v }),

  noteModalOpen: false,
  setNoteModalOpen: (v) => set({ noteModalOpen: v }),

  projectModalOpen: false,
  setProjectModalOpen: (v) => set({ projectModalOpen: v }),

  eventModal: { open: false },
  openEventModal: (initial) => set({ eventModal: { open: true, initial } }),
  closeEventModal: () => set({ eventModal: { open: false, initial: undefined } }),

  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
}));
