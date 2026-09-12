"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/Dialog";
import { Input, Label, Textarea, NativeSelect } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useUIStore } from "@/lib/store/uiStore";
import useSWR, { useSWRConfig } from "swr";
import { fetcher, apiFetch, apiMutate } from "@/lib/apiClient";
import type { Category, Task } from "@/types";
import { toast } from "sonner";
import { Sparkles, Wand2, Trash2, Plus, X } from "lucide-react";
import { DEFAULT_CATEGORIES } from "@/types";

const PRIORITIES = ["low", "medium", "high", "critical"] as const;

export function TaskModal() {
  const { open, task, initial } = useUIStore((s) => s.taskModal);
  const closeTaskModal = useUIStore((s) => s.closeTaskModal);
  const { mutate } = useSWRConfig();
  const { data: catData } = useSWR<{ categories: Category[] }>(open ? "/api/categories" : null, fetcher);
  const categories = catData?.categories?.length ? catData.categories : DEFAULT_CATEGORIES.map((c, i) => ({ ...c, id: String(i), userId: "", isDefault: true, createdAt: "" }));

  const [quickText, setQuickText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({});
  const [tagsInput, setTagsInput] = useState("");
  const [subtaskInput, setSubtaskInput] = useState("");

  useEffect(() => {
    if (open) {
      setForm({
        title: task?.title ?? "",
        description: task?.description ?? "",
        date: task?.date ?? initial?.date ?? new Date().toISOString().slice(0, 10),
        startTime: task?.startTime ?? initial?.startTime ?? "",
        endTime: task?.endTime ?? "",
        priority: task?.priority ?? "medium",
        category: task?.category ?? "",
        estimatedMinutes: task?.estimatedMinutes ?? "",
        location: task?.location ?? "",
        reminderMinutesBefore: task?.reminderMinutesBefore ?? "",
        notes: task?.notes ?? "",
        energyLevel: task?.energyLevel ?? "",
        parentTaskId: initial?.parentTaskId ?? task?.parentTaskId ?? null,
      });
      setTagsInput(task?.tags?.map((t) => t.name).join(", ") ?? "");
      setQuickText("");
    }
  }, [open, task, initial]);

  async function handleQuickParse() {
    if (!quickText.trim()) return;
    setParsing(true);
    try {
      const { parsed } = await apiFetch<{ parsed: any }>("/api/ai/parse-task", { method: "POST", body: JSON.stringify({ text: quickText }) });
      setForm((f: any) => ({
        ...f,
        title: parsed.title || f.title,
        date: parsed.date || f.date,
        startTime: parsed.startTime || f.startTime,
        endTime: parsed.endTime || f.endTime,
        estimatedMinutes: parsed.estimatedMinutes || f.estimatedMinutes,
        category: parsed.category || f.category,
        priority: parsed.priority || f.priority,
        reminderMinutesBefore: parsed.reminderMinutesBefore || f.reminderMinutesBefore,
        location: parsed.location || f.location,
      }));
      if (parsed.tags?.length) setTagsInput(parsed.tags.join(", "));
      toast.success("Parsed with AI — review and save.");
    } catch {
      toast.error("Couldn't parse that. Try rephrasing.");
    } finally {
      setParsing(false);
    }
  }

  async function handleSave() {
    if (!form.title?.trim()) {
      toast.error("Give the task a title.");
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      estimatedMinutes: form.estimatedMinutes ? Number(form.estimatedMinutes) : undefined,
      reminderMinutesBefore: form.reminderMinutesBefore ? Number(form.reminderMinutesBefore) : undefined,
      tags: tagsInput.split(",").map((t) => t.trim()).filter(Boolean),
    };
    try {
      if (task) {
        await apiMutate(`/api/tasks/${task.id}`, "PATCH", payload);
        toast.success("Task updated");
      } else {
        await apiMutate("/api/tasks", "POST", payload);
        toast.success("Task created");
      }
      mutate((key) => typeof key === "string" && key.startsWith("/api/tasks"));
      mutate("/api/dashboard");
      mutate((key) => typeof key === "string" && key.startsWith("/api/calendar"));
      closeTaskModal();
    } catch {
      /* toast handled by apiMutate */
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!task) return;
    if (!confirm(`Delete "${task.title}"?`)) return;
    await apiMutate(`/api/tasks/${task.id}`, "DELETE");
    mutate((key) => typeof key === "string" && key.startsWith("/api/tasks"));
    mutate("/api/dashboard");
    toast.success("Task deleted");
    closeTaskModal();
  }

  async function handleAddSubtask() {
    if (!task || !subtaskInput.trim()) return;
    await apiMutate(`/api/tasks/${task.id}/actions`, "POST", { action: "add-subtask", title: subtaskInput });
    setSubtaskInput("");
    mutate((key) => typeof key === "string" && key.startsWith("/api/tasks"));
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && closeTaskModal()}>
      <DialogContent title={task ? "Edit task" : "Create task"} description={initial?.parentTaskId ? "Adding a subtask" : "Fill in the details, or describe it in plain English below."} size="lg">
        {!task && (
          <div className="mb-4 rounded-xl border border-accent/30 bg-accent/5 p-3">
            <div className="flex items-center gap-2 text-xs font-medium text-accent mb-2">
              <Sparkles className="h-3.5 w-3.5" /> Quick add with AI
            </div>
            <div className="flex gap-2">
              <Input
                value={quickText}
                onChange={(e) => setQuickText(e.target.value)}
                placeholder='e.g. "Tomorrow at 7 PM study DBMS for 2 hours"'
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleQuickParse())}
              />
              <Button type="button" variant="subtle" onClick={handleQuickParse} disabled={parsing}>
                <Wand2 className="h-4 w-4" /> {parsing ? "Parsing…" : "Parse"}
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={form.title ?? ""} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="What needs to get done?" />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={2} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Add more context…" />
          </div>

          <div>
            <Label htmlFor="date">Date</Label>
            <Input id="date" type="date" value={form.date ?? ""} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="startTime">Start time</Label>
              <Input id="startTime" type="time" value={form.startTime ?? ""} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="endTime">End time</Label>
              <Input id="endTime" type="time" value={form.endTime ?? ""} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
            </div>
          </div>

          <div>
            <Label htmlFor="priority">Priority</Label>
            <NativeSelect id="priority" value={form.priority ?? "medium"} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p[0].toUpperCase() + p.slice(1)}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <NativeSelect id="category" value={form.category ?? ""} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="">None</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.icon} {c.name}
                </option>
              ))}
            </NativeSelect>
          </div>

          <div>
            <Label htmlFor="estimatedMinutes">Estimated duration (min)</Label>
            <Input id="estimatedMinutes" type="number" min={0} value={form.estimatedMinutes ?? ""} onChange={(e) => setForm({ ...form, estimatedMinutes: e.target.value })} placeholder="30" />
          </div>
          <div>
            <Label htmlFor="reminderMinutesBefore">Reminder (min before)</Label>
            <Input id="reminderMinutesBefore" type="number" min={0} value={form.reminderMinutesBefore ?? ""} onChange={(e) => setForm({ ...form, reminderMinutesBefore: e.target.value })} placeholder="15" />
          </div>

          <div>
            <Label htmlFor="location">Location</Label>
            <Input id="location" value={form.location ?? ""} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Library, Zoom…" />
          </div>
          <div>
            <Label htmlFor="energyLevel">Energy level</Label>
            <NativeSelect id="energyLevel" value={form.energyLevel ?? ""} onChange={(e) => setForm({ ...form, energyLevel: e.target.value })}>
              <option value="">Any</option>
              <option value="high">🔋 High</option>
              <option value="medium">🟡 Medium</option>
              <option value="low">🔴 Low</option>
            </NativeSelect>
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="tags">Tags (comma separated)</Label>
            <Input id="tags" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="urgent, exam, personal" />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" rows={2} value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>

        {task && !task.parentTaskId && (
          <div className="mt-5 border-t border-border pt-4">
            <Label>Subtasks</Label>
            <div className="space-y-1.5 mb-2">
              {task.subtasks?.map((s) => (
                <div key={s.id} className="flex items-center gap-2 text-sm px-2.5 py-1.5 rounded-lg bg-surface-2">
                  <span className={s.status === "completed" ? "line-through text-muted" : ""}>{s.title}</span>
                </div>
              ))}
              {!task.subtasks?.length && <p className="text-xs text-muted">No subtasks yet.</p>}
            </div>
            <div className="flex gap-2">
              <Input value={subtaskInput} onChange={(e) => setSubtaskInput(e.target.value)} placeholder="Add a subtask…" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddSubtask())} />
              <Button type="button" variant="secondary" onClick={handleAddSubtask}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <div>
            {task && (
              <Button variant="ghost" className="text-danger hover:bg-danger/10" onClick={handleDelete}>
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={closeTaskModal}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : task ? "Save changes" : "Create task"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
