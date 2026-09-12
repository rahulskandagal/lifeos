"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/Dialog";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useUIStore } from "@/lib/store/uiStore";
import { useSWRConfig } from "swr";
import { apiMutate } from "@/lib/apiClient";
import { toast } from "sonner";

export function NoteModal() {
  const open = useUIStore((s) => s.noteModalOpen);
  const setOpen = useUIStore((s) => s.setNoteModalOpen);
  const { mutate } = useSWRConfig();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!title.trim()) {
      toast.error("Give the note a title.");
      return;
    }
    setSaving(true);
    try {
      await apiMutate("/api/notes", "POST", { title, content });
      toast.success("Note created");
      mutate((k) => typeof k === "string" && k.startsWith("/api/notes"));
      setOpen(false);
      setTitle("");
      setContent("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent title="New note" description="Markdown supported.">
        <div className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Note title" />
          </div>
          <div>
            <Label>Content</Label>
            <Textarea rows={8} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write your note in markdown…" />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save note"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
