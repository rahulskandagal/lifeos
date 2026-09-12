"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/apiClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { Skeleton } from "@/components/ui/Skeleton";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/Button";

const COLORS = ["#7C3AED", "#6366F1", "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#EC4899", "#22C55E", "#8B5CF6", "#F97316"];
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const { data, isLoading } = useSWR<any>(`/api/analytics?days=${days}`, fetcher);
  const summary = data?.summary;

  const dailySeries = (data?.dailySeries ?? []).map((d: any) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
  }));

  const categoryData = (data?.categoryBreakdown ?? []).map((c: any) => ({ name: c.category, value: c.count }));
  const hourData = Array.from({ length: 24 }, (_, h) => ({
    hour: `${h}:00`,
    count: (data?.hourProductivity ?? []).find((r: any) => Number(r.hour) === h)?.count ?? 0,
  })).filter((d, i) => i >= 5 && i <= 23);
  const dowData = DAY_LABELS.map((label, i) => ({ label, count: (data?.dayOfWeekProductivity ?? []).find((r: any) => Number(r.dow) === i)?.count ?? 0 }));

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border p-0.5 bg-surface">
            {[7, 30, 90].map((d) => (
              <button key={d} onClick={() => setDays(d)} className={cn("h-8 px-3 rounded-md text-xs font-medium", days === d ? "bg-accent/12 text-accent" : "text-muted")}>
                {d}d
              </button>
            ))}
          </div>
          <Button variant="secondary" size="sm" asChild>
            <a href="/api/export?type=tasks&format=csv">
              <Download className="h-3.5 w-3.5" /> Export
            </a>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard label="Tasks completed" value={summary?.tasksCompleted} sub={`${summary?.completionPct}% completion`} />
          <MetricCard label="Focus time" value={`${Math.round((summary?.totalFocusMinutes ?? 0) / 60)}h ${(summary?.totalFocusMinutes ?? 0) % 60}m`} />
          <MetricCard label="Avg task time" value={`${summary?.avgTaskMinutes ?? 0}m`} />
          <MetricCard label="Overdue" value={summary?.overdueCount} accent="danger" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Tasks completed & focus time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={dailySeries}>
                <defs>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="var(--muted)" />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--muted)" />
                <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="completed" stroke="#7C3AED" fill="url(#colorCompleted)" strokeWidth={2} name="Tasks completed" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Task categories</CardTitle>
          </CardHeader>
          <CardContent>
            {!categoryData.length ? (
              <p className="text-xs text-muted text-center py-16">No categorized tasks yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                    {categoryData.map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Most productive hours</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={hourData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} stroke="var(--muted)" interval={2} />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--muted)" allowDecimals={false} />
                <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="count" fill="#6366F1" radius={[4, 4, 0, 0]} name="Tasks completed" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Most productive days</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dowData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="var(--muted)" />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--muted)" allowDecimals={false} />
                <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} name="Tasks completed" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <RingStat label="Habit success" value={summary?.habitSuccessRate ?? 0} />
        <RingStat label="Goal progress" value={summary?.avgGoalProgress ?? 0} />
        <RingStat label="Task completion" value={summary?.completionPct ?? 0} />
        <div className="card-surface p-4 flex flex-col items-center justify-center text-center">
          <p className="text-2xl font-bold text-gradient-accent">Lv.{summary?.level ?? 1}</p>
          <p className="text-xs text-muted mt-1">{summary?.xp ?? 0} XP · 🔥{summary?.currentStreak ?? 0}d streak</p>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, sub, accent }: { label: string; value: React.ReactNode; sub?: string; accent?: "danger" }) {
  return (
    <div className="card-surface p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className={cn("text-xl font-bold mt-1", accent === "danger" && "text-danger")}>{value ?? 0}</p>
      {sub && <p className="text-[11px] text-muted mt-0.5">{sub}</p>}
    </div>
  );
}

function RingStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card-surface p-4 flex flex-col items-center justify-center gap-2">
      <ProgressRing value={value} size={64} strokeWidth={6} />
      <p className="text-xs text-muted text-center">{label}</p>
    </div>
  );
}
