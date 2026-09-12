"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUIStore } from "@/lib/store/uiStore";

const ROUTES: Record<string, string> = {
  c: "/calendar",
  h: "/habits",
  g: "/goals",
  a: "/analytics",
};

/**
 * Global keyboard shortcuts (section 46):
 *  N -> new task   F -> focus mode   C -> calendar   H -> habits
 *  G -> goals       A -> analytics    / -> search      Ctrl+K -> command palette
 * Ignored while typing in an input/textarea/contenteditable.
 */
export function useKeyboardShortcuts() {
  const router = useRouter();
  const openTaskModal = useUIStore((s) => s.openTaskModal);
  const setCommandPaletteOpen = useUIStore((s) => s.setCommandPaletteOpen);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const isTyping = ["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName) || target?.isContentEditable;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTyping) {
        if (e.key === "Escape") target.blur();
        return;
      }

      if (e.key === "/") {
        e.preventDefault();
        setCommandPaletteOpen(true);
        return;
      }
      if (e.key.toLowerCase() === "n") {
        e.preventDefault();
        openTaskModal();
        return;
      }
      if (e.key.toLowerCase() === "f") {
        e.preventDefault();
        router.push("/focus");
        return;
      }
      const route = ROUTES[e.key.toLowerCase()];
      if (route) {
        e.preventDefault();
        router.push(route);
      }
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [router, openTaskModal, setCommandPaletteOpen]);
}
