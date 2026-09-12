"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/apiClient";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { WeatherWidget } from "@/components/dashboard/WeatherWidget";
import { AIDailyPlanCard } from "@/components/dashboard/AIDailyPlanCard";
import { useLiveClock, greeting, motivationalMessage } from "@/components/dashboard/LiveClock";
import { TaskRow } from "@/components/tasks/TaskRow";
import { EmptyState, Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { useUIStore } from "@/lib/store/uiStore";
import Link from "next/link";
import { CheckSquare, Flame, Timer, ListTodo, Target, Sparkles, Plus, TrendingUp, AlertCircle } from "lucide-react";

export default function DashboardPage() {
  const { data: session } = useSession();
  const now = useLiveClock();
  const openTaskModal = useUIStore((s) => s.openTaskModal);
  const { data, isLoading } = useSWR<any>("/api/dashboard", fetcher, { refreshInterval: 60000 });

  const firstName = session?.user?.name?.split(" ")[0] ?? "there";

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="animate-fade-in-up">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {now ? greeting(now) : "Hello"}, {firstName} 👋
            </h1>
            <p className="text-sm text-muted mt-1">
              {now?.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
              {" · "}
              {now?.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <WeatherWidget />
            <Button onClick={() => openTaskModal()}>
              <Plus className="h-4 w-4" /> Add task
            </Button>
          </div>
        </div>
        <p className="text-sm text-accent italic mt-3">✨ {now ? motivationalMessage(now) : ""}</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          icon={<ProgressRing value={data?.productivityScore?.score ?? 0} size={48} strokeWidth={5} />}
          label="Productivity score"
          value={isLoading ? undefined : `${data?.productivityScore?.score ?? 0}%`}
          hideValue
        />
        <StatCard icon={<CheckSquare className="h-5 w-5 text-success" />} label="Completed today" value={isLoading ? undefined : data?.completedTodayCount} />
        <StatCard icon={<ListTodo className="h-5 w-5 text-info" />} label="Remaining today" value={isLoading ? undefined : data?.remainingTodayCount} />
        <StatCard icon={<Flame className="h-5 w-5 text-warning" />} label="Current streak" value={isLoading ? undefined : `${data?.gamification?.currentStreak ?? 0}d`} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard icon={<Timer className="h-5 w-5 text-accent" />} label="Focus time today" value={isLoading ? undefined : `${data?.focusMinutesToday ?? 0}m`} />
        <StatCard icon={<Target className="h-5 w-5 text-danger" />} label="Active goals" value={isLoading ? undefined : data?.goals?.length} />
        <StatCard icon={<TrendingUp className="h-5 w-5 text-success" />} label="Level" value={isLoading ? undefined : `Lv. ${data?.gamification?.level ?? 1}`} />
        <StatCard icon={<AlertCircle className="h-5 w-5 text-danger" />} label="Overdue" value={isLoading ? undefined : data?.overdueCount} accent={data?.overdueCount ? "danger" : undefined} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's tasks */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Today's tasks</CardTitle>
            <Link href="/tasks" className="text-xs text-accent hover:underline font-medium">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            )}
            {!isLoading && !data?.todayTasks?.length && (
              <EmptyState
                icon="🌤️"
                title="Nothing scheduled today"
                description="Add a task or let AI plan your day."
                action={
                  <Button size="sm" onClick={() => openTaskModal()}>
                    <Plus className="h-3.5 w-3.5" /> Add task
                  </Button>
                }
              />
            )}
            <div className="space-y-0.5">
              {data?.todayTasks?.map((t: any) => (
                <TaskRow key={t.id} task={t} />
              ))}
            </div>
          </CardContent>
        </Card>

        <AIDailyPlanCard />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Habits widget */}
        <Card>
          <CardHeader>
            <CardTitle>Habits today</CardTitle>
            <Link href="/habits" className="text-xs text-accent hover:underline font-medium">
              View all
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {!data?.habits?.length && <EmptyState icon="🔁" title="No habits yet" />}
            {data?.habits?.slice(0, 5).map((h: any) => (
              <div key={h.id} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span>{h.icon}</span> {h.name}
                </span>
                <span className="text-xs text-muted">🔥 {h.currentStreak ?? 0}d</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Goals widget */}
        <Card>
          <CardHeader>
            <CardTitle>Active goals</CardTitle>
            <Link href="/goals" className="text-xs text-accent hover:underline font-medium">
              View all
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {!data?.goals?.length && <EmptyState icon="🎯" title="No goals yet" />}
            {data?.goals?.slice(0, 4).map((g: any) => (
              <div key={g.id}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="truncate">{g.title}</span>
                  <span className="text-xs text-muted">{g.progress}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
                  <div className="h-full gradient-accent rounded-full transition-all" style={{ width: `${g.progress}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* AI insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-accent" /> AI Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {!data?.insights?.length && <EmptyState icon="✨" title="Complete tasks to unlock insights" />}
            {data?.insights?.map((i: any, idx: number) => (
              <p key={idx} className="text-xs leading-relaxed">
                <span className="mr-1">{i.icon}</span>
                {i.text}
              </p>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, hideValue, accent }: { icon: React.ReactNode; label: string; value?: React.ReactNode; hideValue?: boolean; accent?: "danger" }) {
  return (
    <div className="card-surface p-4 flex items-center gap-3 animate-fade-in-up">
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${accent === "danger" ? "bg-danger/10" : "bg-surface-2"}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-muted truncate">{label}</p>
        {!hideValue && <p className="text-lg font-bold truncate">{value ?? <Skeleton className="h-5 w-10" />}</p>}
      </div>
    </div>
  );
}
