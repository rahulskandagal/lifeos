"use client";

import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { fetcher, apiFetch } from "@/lib/apiClient";
import { Button } from "@/components/ui/Button";
import { NativeSelect, Input, Label } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Play, Pause, RotateCcw, Maximize2, Minimize2, Coffee, Brain } from "lucide-react";
import type { Task, FocusSession } from "@/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";

type Mode = "focus" | "short_break" | "long_break";

const DURATIONS: Record<Mode, number> = { focus: 25, short_break: 5, long_break: 15 };

export default function FocusPage() {
  const { data: taskData } = useSWR<{ tasks: Task[] }>("/api/tasks?completed=false", fetcher);
  const { data: sessionData, mutate } = useSWR<{ sessions: FocusSession[]; focusMinutesToday: number }>("/api/focus", fetcher);

  const [mode, setMode] = useState<Mode>("focus");
  const [customMinutes, setCustomMinutes] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [taskId, setTaskId] = useState<string>("");
  const [fullscreen, setFullscreen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef<number>(0);

  useEffect(() => {
    setSecondsLeft(customMinutes * 60);
  }, [mode, customMinutes]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            handleComplete();
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  async function handleStart() {
    if (!running) {
      const res = await apiFetch<{ session: FocusSession }>("/api/focus", {
        method: "POST",
        body: JSON.stringify({ taskId: taskId || undefined, mode: mode === "focus" ? "pomodoro" : "custom", plannedMinutes: customMinutes }),
      });
      setSessionId(res.session.id);
      startRef.current = Date.now();
    }
    setRunning(true);
  }

  function handlePause() {
    setRunning(false);
  }

  async function handleReset() {
    setRunning(false);
    if (sessionId) {
      const actualMinutes = Math.round((Date.now() - startRef.current) / 60000);
      await apiFetch("/api/focus", { method: "POST", body: JSON.stringify({ action: "end", id: sessionId, actualMinutes, completed: false, interrupted: true }) });
      setSessionId(null);
      mutate();
    }
    setSecondsLeft(customMinutes * 60);
  }

  async function handleComplete() {
    setRunning(false);
    if (sessionId) {
      await apiFetch("/api/focus", { method: "POST", body: JSON.stringify({ action: "end", id: sessionId, actualMinutes: customMinutes, completed: true }) });
      setSessionId(null);
      setSessionsCompleted((c) => c + 1);
      mutate();
      toast.success(mode === "focus" ? "Focus session complete! Take a break." : "Break's over — ready to focus?");
      if (mode === "focus") {
        const nextMode = (sessionsCompleted + 1) % 4 === 0 ? "long_break" : "short_break";
        setMode(nextMode);
        setCustomMinutes(DURATIONS[nextMode]);
      } else {
        setMode("focus");
        setCustomMinutes(DURATIONS.focus);
      }
    }
  }

  const progress = 1 - secondsLeft / (customMinutes * 60 || 1);
  const mm = Math.floor(secondsLeft / 60).toString().padStart(2, "0");
  const ss = (secondsLeft % 60).toString().padStart(2, "0");

  const totalToday = sessionData?.focusMinutesToday ?? 0;
  const sessions = sessionData?.sessions ?? [];
  const weekMinutes = sessions.filter((s) => new Date(s.startedAt).getTime() > Date.now() - 7 * 86400000).reduce((s, f) => s + (f.actualMinutes ?? 0), 0);
  const monthMinutes = sessions.filter((s) => new Date(s.startedAt).getTime() > Date.now() - 30 * 86400000).reduce((s, f) => s + (f.actualMinutes ?? 0), 0);

  return (
    <div className={cn("max-w-4xl mx-auto px-4 md:px-6 py-6 space-y-6", fullscreen && "fixed inset-0 z-50 bg-background max-w-none overflow-y-auto flex flex-col items-center justify-center py-0")}>
      {!fullscreen && <h1 className="text-2xl font-bold tracking-tight">Focus Mode</h1>}

      <Card className={cn(fullscreen && "border-none shadow-none bg-transparent w-full max-w-lg")}>
        <CardContent className="pt-6 flex flex-col items-center">
          <div className="flex rounded-lg border border-border p-0.5 bg-surface mb-6">
            {(["focus", "short_break", "long_break"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setCustomMinutes(DURATIONS[m]);
                  setRunning(false);
                }}
                className={cn("h-8 px-3 rounded-md text-xs font-medium capitalize flex items-center gap-1.5", mode === m ? "bg-accent/12 text-accent" : "text-muted")}
              >
                {m === "focus" ? <Brain className="h-3.5 w-3.5" /> : <Coffee className="h-3.5 w-3.5" />}
                {m.replace("_", " ")}
              </button>
            ))}
          </div>

          <div className="relative h-64 w-64 flex items-center justify-center mb-6">
            <svg className="absolute inset-0 -rotate-90" width="256" height="256">
              <circle cx="128" cy="128" r="118" fill="none" stroke="var(--border)" strokeWidth="8" />
              <circle
                cx="128"
                cy="128"
                r="118"
                fill="none"
                stroke="var(--accent)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 118}
                strokeDashoffset={2 * Math.PI * 118 * (1 - progress)}
                style={{ transition: "stroke-dashoffset 1s linear" }}
              />
            </svg>
            <div className="text-center">
              <p className="text-5xl font-bold tabular-nums">
                {mm}:{ss}
              </p>
              <p className="text-xs text-muted mt-1 capitalize">{mode.replace("_", " ")}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <Button variant="secondary" size="icon" onClick={handleReset}>
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button size="lg" onClick={running ? handlePause : handleStart} className="w-32">
              {running ? (
                <>
                  <Pause className="h-4 w-4" /> Pause
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" /> Start
                </>
              )}
            </Button>
            <Button variant="secondary" size="icon" onClick={() => setFullscreen((f) => !f)}>
              {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>

          {!fullscreen && (
            <div className="w-full max-w-sm space-y-3">
              <div>
                <Label>Working on</Label>
                <NativeSelect value={taskId} onChange={(e) => setTaskId(e.target.value)} disabled={running}>
                  <option value="">No specific task</option>
                  {taskData?.tasks?.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <div>
                <Label>Custom duration (min)</Label>
                <Input type="number" min={1} value={customMinutes} disabled={running} onChange={(e) => setCustomMinutes(Number(e.target.value) || 1)} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {!fullscreen && (
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-xs text-muted">Today</p>
              <p className="text-xl font-bold">{totalToday}m</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-xs text-muted">This week</p>
              <p className="text-xl font-bold">{weekMinutes}m</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <p className="text-xs text-muted">This month</p>
              <p className="text-xl font-bold">{monthMinutes}m</p>
            </CardContent>
          </Card>
        </div>
      )}

      {!fullscreen && (
        <Card>
          <CardHeader>
            <CardTitle>Recent sessions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {!sessions.length && <p className="text-xs text-muted">No sessions yet — start your first focus session above.</p>}
            {sessions.slice(0, 8).map((s) => (
              <div key={s.id} className="flex items-center justify-between text-xs py-1.5 border-b border-border last:border-0">
                <span className="text-muted">{new Date(s.startedAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                <span>{s.actualMinutes ?? s.plannedMinutes}m</span>
                <span className={s.completed ? "text-success" : "text-warning"}>{s.completed ? "Completed" : "Interrupted"}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
