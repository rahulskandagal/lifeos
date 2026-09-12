"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/Dialog";
import { Input, Label, NativeSelect } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useUIStore } from "@/lib/store/uiStore";
import { useSWRConfig } from "swr";
import { apiMutate } from "@/lib/apiClient";
import { toast } from "sonner";

const ICONS = ["✅", "🏋️", "📚", "💧", "📖", "🧘", "🏃", "😴", "💻", "🎨", "🚶", "🥗"];

export function HabitModal() {
  const open = useUIStore((s) => s.habitModalOpen);
  const setOpen = useUIStore((s) => s.setHabitModalOpen);
  const { mutate } = useSWRConfig();
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("✅");
  const [frequency, setFrequency] = useState("daily");
  const [targetPerWeek, setTargetPerWeek] = useState(7);
  const [reminderTime, setReminderTime] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) {
      toast.error("Name your habit.");
      return;
    }
    setSaving(true);
    try {
      await apiMutate("/api/habits", "POST", { name, icon, frequency, targetPerWeek, reminderTime: reminderTime || undefined });
      toast.success("Habit created");
      mutate("/api/habits");
      mutate("/api/dashboard");
      setOpen(false);
      setName("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent title="New habit" description="Small, repeatable actions compound over time.">
        <div className="space-y-4">
          <div>
            <Label>Habit name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Exercise, Read, Meditate…" />
          </div>
          <div>
            <Label>Icon</Label>
            <div className="flex flex-wrap gap-1.5">
              {ICONS.map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIcon(i)}
                  className={`h-9 w-9 rounded-lg flex items-center justify-center text-lg border transition-colors ${icon === i ? "border-accent bg-accent/10" : "border-border hover:bg-surface-2"}`}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Frequency</Label>
              <NativeSelect value={frequency} onChange={(e) => setFrequency(e.target.value)}>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="custom">Custom</option>
              </NativeSelect>
            </div>
            <div>
              <Label>Target / week</Label>
              <Input type="number" min={1} max={7} value={targetPerWeek} onChange={(e) => setTargetPerWeek(Number(e.target.value))} />
            </div>
          </div>
          <div>
            <Label>Reminder time (optional)</Label>
            <Input type="time" value={reminderTime} onChange={(e) => setReminderTime(e.target.value)} />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Create habit"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
