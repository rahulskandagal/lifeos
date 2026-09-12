"use client";

import { useEffect, useRef, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { fetcher, apiFetch } from "@/lib/apiClient";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Sparkles, Send, Loader2 } from "lucide-react";
import type { AIInteraction } from "@/types";
import { cn } from "@/lib/utils/cn";

const SUGGESTIONS = [
  "Plan my day",
  "What's overdue?",
  "What should I do next?",
  "Why was my productivity low this week?",
  "Break down my final year project",
  "Create a study schedule for DBMS",
  "Show my progress this month",
];

export default function AIPage() {
  const { data, mutate } = useSWR<{ messages: AIInteraction[] }>("/api/ai/chat", fetcher);
  const { mutate: globalMutate } = useSWRConfig();
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const messages = data?.messages ?? [];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, sending]);

  async function send(text: string) {
    if (!text.trim() || sending) return;
    setInput("");
    setSending(true);
    mutate((prev) => ({ messages: [...(prev?.messages ?? []), { id: "tmp", userId: "", role: "user", content: text, createdAt: new Date().toISOString() }] }), { revalidate: false });
    try {
      await apiFetch("/api/ai/chat", { method: "POST", body: JSON.stringify({ message: text }) });
      mutate();
      globalMutate((k) => typeof k === "string" && (k.startsWith("/api/tasks") || k.startsWith("/api/dashboard")));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 flex flex-col h-[calc(100vh-64px)]">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-9 w-9 rounded-xl gradient-accent flex items-center justify-center text-white">
          <Sparkles className="h-4.5 w-4.5" />
        </div>
        <div>
          <h1 className="text-lg font-bold">AI Assistant</h1>
          <p className="text-xs text-muted">Plan, prioritize, and organize — just ask.</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4">
        {!messages.length && (
          <div className="py-10 text-center">
            <p className="text-sm text-muted mb-4">Try asking me something:</p>
            <div className="flex flex-wrap gap-2 justify-center max-w-lg mx-auto">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)} className="text-xs rounded-full border border-border bg-surface px-3 py-1.5 hover:border-accent hover:text-accent transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={m.id + i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed",
                m.role === "user" ? "gradient-accent text-white rounded-br-sm" : "card-surface rounded-bl-sm"
              )}
            >
              {m.content}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="card-surface rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm flex items-center gap-2 text-muted">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking…
            </div>
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex gap-2 pt-2 border-t border-border"
      >
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask LifeOS anything about your day…" autoFocus />
        <Button type="submit" disabled={sending || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
