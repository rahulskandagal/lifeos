"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/Dialog";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useUIStore } from "@/lib/store/uiStore";
import { useSWRConfig } from "swr";
import { apiMutate } from "@/lib/apiClient";
import { toast } from "sonner";

const COLORS = ["#7C3AED", "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#EC4899"];

export function ProjectModal() {
  const open = useUIStore((s) => s.projectModalOpen);
  const setOpen = useUIStore((s) => s.setProjectModalOpen);
  const { mutate } = useSWRConfig();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) {
      toast.error("Name your project.");
      return;
    }
    setSaving(true);
    try {
      await apiMutate("/api/projects", "POST", { name, description, deadline: deadline || undefined, color });
      toast.success("Project created");
      mutate("/api/projects");
      setOpen(false);
      setName("");
      setDescription("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent title="New project" description="Group related tasks together.">
        <div className="space-y-4">
          <div>
            <Label>Project name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Final Year Project" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div>
            <Label>Deadline</Label>
            <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>
          <div>
            <Label>Color</Label>
            <div className="flex gap-1.5">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="h-8 w-8 rounded-full border-2 transition-transform"
                  style={{ background: c, borderColor: color === c ? c : "transparent", transform: color === c ? "scale(1.1)" : undefined }}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Create project"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
