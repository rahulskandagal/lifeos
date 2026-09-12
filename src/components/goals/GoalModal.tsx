"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/Dialog";
import { Input, Label, NativeSelect, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useUIStore } from "@/lib/store/uiStore";
import { useSWRConfig } from "swr";
import { apiMutate } from "@/lib/apiClient";
import { toast } from "sonner";
import { X, Plus } from "lucide-react";

export function GoalModal() {
  const open = useUIStore((s) => s.goalModalOpen);
  const setOpen = useUIStore((s) => s.setGoalModalOpen);
  const { mutate } = useSWRConfig();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [term, setTerm] = useState("short");
  const [targetDate, setTargetDate] = useState("");
  const [milestones, setMilestones] = useState<string[]>([]);
  const [milestoneInput, setMilestoneInput] = useState("");
  const [saving, setSaving] = useState(false);

  function addMilestone() {
    if (!milestoneInput.trim()) return;
    setMilestones((m) => [...m, milestoneInput.trim()]);
    setMilestoneInput("");
  }

  async function handleSave() {
    if (!title.trim()) {
      toast.error("Give the goal a title.");
      return;
    }
    setSaving(true);
    try {
      await apiMutate("/api/goals", "POST", { title, description, term, targetDate: targetDate || undefined, milestones });
      toast.success("Goal created");
      mutate((k) => typeof k === "string" && k.startsWith("/api/goals"));
      mutate("/api/dashboard");
      setOpen(false);
      setTitle("");
      setDescription("");
      setMilestones([]);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent title="New goal" description="Short-term, medium-term, or long-term — break it into milestones.">
        <div className="space-y-4">
          <div>
            <Label>Goal title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Learn Python, Run a 10k…" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Term</Label>
              <NativeSelect value={term} onChange={(e) => setTerm(e.target.value)}>
                <option value="short">Short-term (daily/weekly)</option>
                <option value="medium">Medium-term (monthly/quarterly)</option>
                <option value="long">Long-term (yearly/life)</option>
              </NativeSelect>
            </div>
            <div>
              <Label>Target date</Label>
              <Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Milestones</Label>
            <div className="flex gap-2 mb-2">
              <Input value={milestoneInput} onChange={(e) => setMilestoneInput(e.target.value)} placeholder="Add a milestone…" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addMilestone())} />
              <Button type="button" variant="secondary" onClick={addMilestone}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-1.5">
              {milestones.map((m, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm px-2.5 py-1.5 rounded-lg bg-surface-2">
                  <span>{m}</span>
                  <button onClick={() => setMilestones((arr) => arr.filter((_, i) => i !== idx))} className="text-muted hover:text-danger">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Create goal"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
