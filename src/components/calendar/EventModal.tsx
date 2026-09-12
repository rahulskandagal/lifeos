"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/Dialog";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useUIStore } from "@/lib/store/uiStore";
import { useSWRConfig } from "swr";
import { apiFetch } from "@/lib/apiClient";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";

function addMinutes(time: string, minutes: number) {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  return `${Math.floor((total / 60) % 24).toString().padStart(2, "0")}:${(total % 60).toString().padStart(2, "0")}`;
}

export function EventModal() {
  const { open, initial } = useUIStore((s) => s.eventModal);
  const closeEventModal = useUIStore((s) => s.closeEventModal);
  const { mutate } = useSWRConfig();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTitle("");
      setDate(initial?.date ?? new Date().toISOString().slice(0, 10));
      setStartTime(initial?.startTime ?? "09:00");
      setEndTime(initial?.startTime ? addMinutes(initial.startTime, 60) : "10:00");
      setLocation("");
      setDescription("");
      setConflictWarning(null);
    }
  }, [open, initial]);

  async function handleSave() {
    if (!title.trim()) {
      toast.error("Give the event a title.");
      return;
    }
    setSaving(true);
    try {
      const { conflicts } = await apiFetch<{ conflicts: any[] }>("/api/calendar", {
        method: "POST",
        body: JSON.stringify({ title, date, startTime, endTime, location, description }),
      });
      if (conflicts?.length) {
        setConflictWarning(`Heads up: this overlaps with "${conflicts[0].title}" (${conflicts[0].startTime}–${conflicts[0].endTime}).`);
      }
      toast.success("Event scheduled");
      mutate((k) => typeof k === "string" && k.startsWith("/api/calendar"));
      closeEventModal();
    } catch {
      /* handled */
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && closeEventModal()}>
      <DialogContent title="New event" description="Add a fixed calendar event.">
        <div className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Team meeting" />
          </div>
          <div>
            <Label>Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Start time</Label>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div>
              <Label>End time</Label>
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Location</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Room 204, Zoom…" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          {conflictWarning && (
            <div className="flex items-start gap-2 text-xs text-warning bg-warning/10 rounded-lg p-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" /> {conflictWarning}
            </div>
          )}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={closeEventModal}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Create event"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
