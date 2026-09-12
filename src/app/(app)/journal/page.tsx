"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { fetcher, apiFetch } from "@/lib/apiClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Textarea, Label, Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { Journal } from "@/types";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const MOODS: { key: Journal["mood"]; emoji: string }[] = [
  { key: "great", emoji: "😄" },
  { key: "good", emoji: "🙂" },
  { key: "okay", emoji: "😐" },
  { key: "bad", emoji: "🙁" },
  { key: "rough", emoji: "😞" },
];

const FIELDS: { key: keyof Journal; label: string; placeholder: string }[] = [
  { key: "whatHappened", label: "What happened today?", placeholder: "A quick recap of your day…" },
  { key: "accomplishments", label: "What did I accomplish?", placeholder: "List your wins, big or small…" },
  { key: "wentWell", label: "What went well?", placeholder: "…" },
  { key: "wentWrong", label: "What went wrong?", placeholder: "…" },
  { key: "improvements", label: "What should I improve?", placeholder: "…" },
  { key: "tomorrowPriorities", label: "Tomorrow's priorities", placeholder: "…" },
];

export default function JournalPage() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const { data, mutate } = useSWR<{ journal: Journal | null }>(`/api/journal?date=${date}`, fetcher);
  const [form, setForm] = useState<Partial<Journal>>({});
  const [saving, setSaving] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const { data: pastData } = useSWR<{ journals: Journal[] }>("/api/journal", fetcher);

  useEffect(() => {
    setForm(data?.journal ?? {});
  }, [data]);

  async function handleSave(showToast = true) {
    setSaving(true);
    try {
      await apiFetch("/api/journal", { method: "PUT", body: JSON.stringify({ date, ...form }) });
      if (showToast) toast.success("Journal saved");
      mutate();
    } finally {
      setSaving(false);
    }
  }

  async function handleSummarize() {
    setSummarizing(true);
    try {
      const text = [form.whatHappened, form.accomplishments, form.wentWell, form.wentWrong].filter(Boolean).join(" ");
      const summary = text
        ? `Today: ${form.accomplishments || "made progress on planned tasks"}. ${form.wentWell ? `Went well: ${form.wentWell}.` : ""} ${form.wentWrong ? `Could improve: ${form.wentWrong}.` : ""}`.trim()
        : "Not enough detail yet — fill in a few fields first.";
      setForm((f) => ({ ...f, aiSummary: summary }));
      await apiFetch("/api/journal", { method: "PUT", body: JSON.stringify({ date, ...form, aiSummary: summary }) });
      toast.success("AI summary generated");
      mutate();
    } finally {
      setSummarizing(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Daily Journal</h1>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-44" />
      </div>

      <Card>
        <CardContent className="pt-4 space-y-4">
          <div>
            <Label>Mood</Label>
            <div className="flex gap-2">
              {MOODS.map((m) => (
                <button
                  key={m.key}
                  onClick={() => setForm((f) => ({ ...f, mood: m.key }))}
                  className={cn("h-10 w-10 rounded-xl flex items-center justify-center text-xl border transition-colors", form.mood === m.key ? "border-accent bg-accent/10" : "border-border hover:bg-surface-2")}
                >
                  {m.emoji}
                </button>
              ))}
            </div>
          </div>

          {FIELDS.map((f) => (
            <div key={f.key}>
              <Label>{f.label}</Label>
              <Textarea
                rows={2}
                value={(form[f.key] as string) ?? ""}
                onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
              />
            </div>
          ))}

          {form.aiSummary && (
            <div className="rounded-xl border border-accent/30 bg-accent/5 p-3">
              <p className="text-xs font-medium text-accent flex items-center gap-1.5 mb-1">
                <Sparkles className="h-3.5 w-3.5" /> AI Summary
              </p>
              <p className="text-xs leading-relaxed">{form.aiSummary}</p>
            </div>
          )}

          <div className="flex gap-2 justify-end pt-2">
            <Button variant="subtle" onClick={handleSummarize} disabled={summarizing}>
              <Sparkles className="h-4 w-4" /> {summarizing ? "Summarizing…" : "AI Summarize"}
            </Button>
            <Button onClick={() => handleSave()} disabled={saving}>
              {saving ? "Saving…" : "Save entry"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Past entries</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {!pastData?.journals?.length && <p className="text-xs text-muted">No entries yet.</p>}
          {pastData?.journals?.slice(0, 10).map((j) => (
            <button key={j.id} onClick={() => setDate(j.date)} className="flex items-center justify-between w-full text-left text-xs px-2.5 py-2 rounded-lg hover:bg-surface-2">
              <span>{new Date(j.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</span>
              <span>{MOODS.find((m) => m.key === j.mood)?.emoji ?? ""}</span>
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
