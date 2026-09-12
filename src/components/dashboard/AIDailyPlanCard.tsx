"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { apiFetch } from "@/lib/apiClient";
import { Sparkles, AlertTriangle, Loader2 } from "lucide-react";
import { EmptyState } from "@/components/ui/Skeleton";
import type { PlanBlock } from "@/lib/ai/dayPlanner";
import { toast } from "sonner";

const TYPE_STYLES: Record<string, string> = {
  task: "bg-accent/10 text-accent",
  habit: "bg-success/10 text-success",
  break: "bg-warning/10 text-warning",
  fixed: "bg-info/10 text-info",
  meal: "bg-orange-500/10 text-orange-500",
};

export function AIDailyPlanCard() {
  const [blocks, setBlocks] = useState<PlanBlock[] | null>(null);
  const [overload, setOverload] = useState<{ overloaded: boolean; message?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    try {
      const res = await apiFetch<{ blocks: PlanBlock[]; overload: any }>("/api/ai/plan-day", { method: "POST", body: JSON.stringify({}) });
      setBlocks(res.blocks);
      setOverload(res.overload);
      if (res.overload?.overloaded) toast.warning(res.overload.message);
    } catch {
      toast.error("Couldn't generate a plan right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-accent" /> AI Daily Plan
        </CardTitle>
        <Button size="sm" variant="subtle" onClick={generate} disabled={loading}>
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          {blocks ? "Regenerate" : "Auto-plan my day"}
        </Button>
      </CardHeader>
      <CardContent>
        {overload?.overloaded && (
          <div className="flex items-start gap-2 text-xs text-warning bg-warning/10 rounded-lg p-2.5 mb-3">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" /> {overload.message}
          </div>
        )}
        {!blocks && !loading && (
          <EmptyState icon="🗓️" title="No plan generated yet" description="Let AI arrange your tasks, habits, and breaks into an optimized schedule." />
        )}
        {loading && <div className="py-8 text-center text-sm text-muted">Building your optimal day…</div>}
        {blocks && (
          <div className="space-y-1 max-h-80 overflow-y-auto">
            {blocks.map((b, i) => (
              <div key={i} className="flex items-center gap-3 text-sm px-2 py-1.5 rounded-lg hover:bg-surface-2">
                <span className="text-xs text-muted font-mono w-24 shrink-0">
                  {b.startTime}–{b.endTime}
                </span>
                <span className={`text-[10px] font-medium rounded px-1.5 py-0.5 shrink-0 ${TYPE_STYLES[b.type] ?? "bg-surface-2"}`}>{b.type}</span>
                <span className="truncate">{b.title}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
