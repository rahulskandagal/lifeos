import { LayoutDashboard, CheckSquare, Calendar, Repeat, Target, Timer, BarChart3, Sparkles, NotebookPen, BookOpen, FolderKanban, Bell, Settings } from "lucide-react";

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, shortcut: "D" },
  { href: "/tasks", label: "Tasks", icon: CheckSquare, shortcut: "T" },
  { href: "/calendar", label: "Calendar", icon: Calendar, shortcut: "C" },
  { href: "/habits", label: "Habits", icon: Repeat, shortcut: "H" },
  { href: "/goals", label: "Goals", icon: Target, shortcut: "G" },
  { href: "/projects", label: "Projects", icon: FolderKanban, shortcut: "P" },
  { href: "/focus", label: "Focus", icon: Timer, shortcut: "F" },
  { href: "/analytics", label: "Analytics", icon: BarChart3, shortcut: "A" },
  { href: "/ai", label: "AI Assistant", icon: Sparkles, shortcut: "I" },
  { href: "/notes", label: "Notes", icon: NotebookPen },
  { href: "/journal", label: "Journal", icon: BookOpen },
] as const;

export const MOBILE_NAV_ITEMS = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/habits", label: "Habits", icon: Repeat },
  { href: "/ai", label: "AI", icon: Sparkles },
] as const;

export const SECONDARY_NAV_ITEMS = [
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;
