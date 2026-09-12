"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { apiFetch } from "@/lib/apiClient";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import {
  AlertTriangle,
  CheckSquare,
  Repeat,
  Target,
  FolderKanban,
  CalendarDays,
  FileText,
  BookOpen,
  Timer,
  Bell,
  Trophy,
  MessageSquare,
  Trash2,
  RotateCcw,
} from "lucide-react";

const SCOPES: { key: string; label: string; icon: typeof CheckSquare }[] = [
  { key: "tasks", label: "Tasks", icon: CheckSquare },
  { key: "habits", label: "Habits", icon: Repeat },
  { key: "goals", label: "Goals", icon: Target },
  { key: "projects", label: "Projects", icon: FolderKanban },
  { key: "calendar", label: "Calendar events", icon: CalendarDays },
  { key: "notes", label: "Notes", icon: FileText },
  { key: "journal", label: "Journal entries", icon: BookOpen },
  { key: "focus", label: "Focus session history", icon: Timer },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "gamification", label: "XP, streaks & badges", icon: Trophy },
  { key: "ai", label: "AI chat history", icon: MessageSquare },
];

const CONFIRM_PHRASE = "RESET";

export function ResetDataSection() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectedConfirmOpen, setSelectedConfirmOpen] = useState(false);
  const [allConfirmOpen, setAllConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [reseedDemoData, setReseedDemoData] = useState(false);
  const [busy, setBusy] = useState(false);

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function eraseSelected() {
    if (!selected.size) return;
    setBusy(true);
    try {
      await apiFetch("/api/settings/reset", {
        method: "POST",
        body: JSON.stringify({ scope: Array.from(selected) }),
      });
      toast.success(`Erased ${selected.size} data ${selected.size === 1 ? "category" : "categories"}. Reloading…`);
      setSelectedConfirmOpen(false);
      window.location.assign("/dashboard");
    } catch {
      setBusy(false);
    }
  }

  async function eraseAll() {
    if (confirmText.trim().toUpperCase() !== CONFIRM_PHRASE) return;
    setBusy(true);
    try {
      await apiFetch("/api/settings/reset", {
        method: "POST",
        body: JSON.stringify({ scope: "all", reseedDemoData }),
      });
      toast.success(reseedDemoData ? "All data erased — repopulated with sample data." : "All data erased. Starting fresh.");
      setAllConfirmOpen(false);
      window.location.assign("/dashboard");
    } catch {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-danger/30 bg-danger/5 p-4">
      <div className="flex items-start gap-2.5 mb-4">
        <AlertTriangle className="h-4 w-4 text-danger shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-danger">Reset data</p>
          <p className="text-xs text-muted mt-0.5">Permanently erase your data and start over, whenever you want. This can't be undone — your account and login stay intact.</p>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <p className="text-xs font-medium text-muted">Erase specific data</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {SCOPES.map((s) => {
            const active = selected.has(s.key);
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => toggle(s.key)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs text-left transition-colors",
                  active ? "border-danger bg-danger/10 text-danger" : "border-border hover:bg-surface-2"
                )}
              >
                <s.icon className="h-3.5 w-3.5 shrink-0" /> {s.label}
              </button>
            );
          })}
        </div>
        <Button variant="danger" size="sm" disabled={!selected.size} onClick={() => setSelectedConfirmOpen(true)}>
          <Trash2 className="h-3.5 w-3.5" /> Erase selected {selected.size ? `(${selected.size})` : ""}
        </Button>
      </div>

      <div className="pt-3 border-t border-danger/20">
        <p className="text-xs font-medium text-muted mb-2">Or wipe everything</p>
        <Button variant="danger" size="sm" onClick={() => setAllConfirmOpen(true)}>
          <RotateCcw className="h-3.5 w-3.5" /> Erase all data & start new
        </Button>
      </div>

      {/* Confirm: erase selected categories */}
      <Dialog open={selectedConfirmOpen} onOpenChange={setSelectedConfirmOpen}>
        <DialogContent title="Erase selected data?" description="This cannot be undone.">
          <p className="text-sm text-muted">
            This will permanently delete: <span className="font-medium text-foreground">{Array.from(selected).map((k) => SCOPES.find((s) => s.key === k)?.label).join(", ")}</span>. Everything else in your account stays as-is.
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setSelectedConfirmOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button variant="danger" onClick={eraseSelected} disabled={busy}>
              {busy ? "Erasing…" : "Erase permanently"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm: erase everything */}
      <Dialog
        open={allConfirmOpen}
        onOpenChange={(v) => {
          setAllConfirmOpen(v);
          if (!v) setConfirmText("");
        }}
      >
        <DialogContent title="Erase ALL data?" description="This wipes your entire account's content — irreversible.">
          <p className="text-sm text-muted">
            Every task, habit, goal, project, calendar event, note, journal entry, focus session, notification, and your XP/streaks/badges will be permanently deleted. Your login and settings are kept.
          </p>
          <label className="flex items-center gap-2 text-xs text-muted mt-4">
            <input type="checkbox" checked={reseedDemoData} onChange={(e) => setReseedDemoData(e.target.checked)} className="rounded accent-[var(--accent)]" />
            Repopulate with sample tasks, habits &amp; goals instead of leaving it blank
          </label>
          <div className="mt-4">
            <Label>
              Type <span className="font-semibold text-danger">{CONFIRM_PHRASE}</span> to confirm
            </Label>
            <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder={CONFIRM_PHRASE} autoComplete="off" />
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setAllConfirmOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button variant="danger" onClick={eraseAll} disabled={busy || confirmText.trim().toUpperCase() !== CONFIRM_PHRASE}>
              {busy ? "Erasing…" : "Erase everything"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
