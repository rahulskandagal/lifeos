"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { fetcher, apiFetch, apiMutate } from "@/lib/apiClient";
import * as Tabs from "@radix-ui/react-tabs";
import { Card, CardContent } from "@/components/ui/Card";
import { Input, Label, NativeSelect } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import * as Switch from "@radix-ui/react-switch";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import { Download, Upload, User, Palette, Bell, Sparkles, Shield, Gauge, Calendar, CheckSquare, Repeat, Database, Plug } from "lucide-react";
import { useTheme } from "next-themes";
import { ResetDataSection } from "@/components/settings/ResetDataSection";

const TABS = [
  { key: "account", label: "Account", icon: User },
  { key: "appearance", label: "Appearance", icon: Palette },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "ai", label: "AI", icon: Sparkles },
  { key: "productivity", label: "Productivity", icon: Gauge },
  { key: "calendar", label: "Calendar", icon: Calendar },
  { key: "data", label: "Data", icon: Database },
  { key: "integrations", label: "Integrations", icon: Plug },
  { key: "privacy", label: "Privacy", icon: Shield },
];

function ToggleRow({ label, description, checked, onChange }: { label: string; description?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted mt-0.5">{description}</p>}
      </div>
      <Switch.Root
        checked={checked}
        onCheckedChange={onChange}
        className={cn("w-10 h-6 rounded-full relative transition-colors shrink-0", checked ? "bg-accent" : "bg-surface-2 border border-border")}
      >
        <Switch.Thumb className="block h-4.5 w-4.5 bg-white rounded-full shadow transition-transform translate-x-0.5 data-[state=checked]:translate-x-[18px]" />
      </Switch.Root>
    </div>
  );
}

export default function SettingsPage() {
  const { data, mutate } = useSWR<{ user: any; settings: any }>("/api/settings", fetcher);
  const [settings, setSettings] = useState<any>({});
  const [profile, setProfile] = useState<any>({});
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (data) {
      setSettings(data.settings);
      setProfile(data.user);
    }
  }, [data]);

  async function save(patch: any) {
    const merged = { ...settings, ...patch };
    setSettings(merged);
    await apiMutate("/api/settings", "PATCH", patch);
    mutate();
  }

  async function saveProfile() {
    await apiMutate("/api/settings", "PATCH", { profile: { name: profile.name, timezone: profile.timezone } });
    toast.success("Profile updated");
    mutate();
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const content = await file.text();
    const format = file.name.endsWith(".csv") ? "csv" : "json";
    try {
      const res = await apiFetch<{ imported: number }>("/api/import", { method: "POST", body: JSON.stringify({ content, format }) });
      toast.success(`Imported ${res.imported} tasks`);
    } catch {
      toast.error("Import failed");
    }
  }

  if (!data) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-6">
      <h1 className="text-2xl font-bold tracking-tight mb-5">Settings</h1>
      <Tabs.Root defaultValue="account" orientation="vertical" className="flex flex-col md:flex-row gap-6">
        <Tabs.List className="flex md:flex-col gap-1 md:w-52 shrink-0 overflow-x-auto">
          {TABS.map((t) => (
            <Tabs.Trigger
              key={t.key}
              value={t.key}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-muted hover:bg-surface-2 data-[state=active]:bg-accent/12 data-[state=active]:text-accent shrink-0 outline-none"
            >
              <t.icon className="h-4 w-4" /> {t.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <div className="flex-1 min-w-0">
          <Tabs.Content value="account">
            <Card>
              <CardContent className="pt-4 space-y-4 max-w-md">
                <div>
                  <Label>Name</Label>
                  <Input value={profile.name ?? ""} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input value={profile.email ?? ""} disabled />
                </div>
                <div>
                  <Label>Timezone</Label>
                  <Input value={profile.timezone ?? ""} onChange={(e) => setProfile({ ...profile, timezone: e.target.value })} placeholder="Asia/Kolkata" />
                </div>
                <Button onClick={saveProfile}>Save profile</Button>
              </CardContent>
            </Card>
          </Tabs.Content>

          <Tabs.Content value="appearance">
            <Card>
              <CardContent className="pt-4 space-y-4 max-w-md">
                <div>
                  <Label>Theme</Label>
                  <div className="flex gap-2">
                    {["light", "dark", "system"].map((t) => (
                      <button
                        key={t}
                        onClick={() => setTheme(t)}
                        className={cn("flex-1 h-10 rounded-lg border text-sm capitalize", theme === t ? "border-accent bg-accent/10 text-accent" : "border-border")}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Accent color</Label>
                  <div className="flex gap-2">
                    {["violet", "blue", "emerald", "amber", "rose"].map((c) => (
                      <button
                        key={c}
                        onClick={() => save({ accentColor: c })}
                        className={cn("h-8 w-8 rounded-full border-2", settings.accentColor === c && "ring-2 ring-offset-2 ring-offset-background ring-accent")}
                        style={{ background: { violet: "#7C3AED", blue: "#3B82F6", emerald: "#10B981", amber: "#F59E0B", rose: "#EF4444" }[c] }}
                      />
                    ))}
                  </div>
                  <p className="text-[11px] text-muted mt-1.5">Accent preference is saved; full theming applies on next load.</p>
                </div>
              </CardContent>
            </Card>
          </Tabs.Content>

          <Tabs.Content value="notifications">
            <Card>
              <CardContent className="pt-4 divide-y divide-border">
                <ToggleRow label="Task due reminders" checked={!!settings.notifyTaskDue} onChange={(v) => save({ notifyTaskDue: v })} />
                <ToggleRow label="Habit reminders" checked={!!settings.notifyHabit} onChange={(v) => save({ notifyHabit: v })} />
                <ToggleRow label="Goal milestone alerts" checked={!!settings.notifyGoalMilestone} onChange={(v) => save({ notifyGoalMilestone: v })} />
                <ToggleRow label="Morning briefing" checked={!!settings.notifyMorningBriefing} onChange={(v) => save({ notifyMorningBriefing: v })} />
                <ToggleRow label="Evening review" checked={!!settings.notifyEveningReview} onChange={(v) => save({ notifyEveningReview: v })} />
              </CardContent>
            </Card>
          </Tabs.Content>

          <Tabs.Content value="ai">
            <Card>
              <CardContent className="pt-4 divide-y divide-border">
                <ToggleRow label="Auto-prioritize tasks" description="AI computes a priority score for new tasks" checked={!!settings.aiAutoPrioritize} onChange={(v) => save({ aiAutoPrioritize: v })} />
                <ToggleRow label="Auto-breakdown large tasks" description="Suggest subtasks for big projects" checked={!!settings.aiAutoBreakdown} onChange={(v) => save({ aiAutoBreakdown: v })} />
                <ToggleRow label="Proactive insights" description="Show AI insights on your dashboard" checked={!!settings.aiProactiveInsights} onChange={(v) => save({ aiProactiveInsights: v })} />
              </CardContent>
            </Card>
            <p className="text-xs text-muted mt-3">
              Connect a real AI model by setting <code className="bg-surface-2 px-1 rounded">AI_API_KEY</code>, <code className="bg-surface-2 px-1 rounded">AI_MODEL</code>, and{" "}
              <code className="bg-surface-2 px-1 rounded">AI_BASE_URL</code> in your environment. Without a key, LifeOS uses its built-in rule-based engine — every AI feature still works.
            </p>
          </Tabs.Content>

          <Tabs.Content value="productivity">
            <Card>
              <CardContent className="pt-4 space-y-4 max-w-md">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Working hours start</Label>
                    <Input type="time" value={settings.workingHoursStart ?? ""} onChange={(e) => save({ workingHoursStart: e.target.value })} />
                  </div>
                  <div>
                    <Label>Working hours end</Label>
                    <Input type="time" value={settings.workingHoursEnd ?? ""} onChange={(e) => save({ workingHoursEnd: e.target.value })} />
                  </div>
                  <div>
                    <Label>Productive hours start</Label>
                    <Input type="time" value={settings.productiveHoursStart ?? ""} onChange={(e) => save({ productiveHoursStart: e.target.value })} />
                  </div>
                  <div>
                    <Label>Productive hours end</Label>
                    <Input type="time" value={settings.productiveHoursEnd ?? ""} onChange={(e) => save({ productiveHoursEnd: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label>Daily focus goal (minutes)</Label>
                  <Input type="number" value={settings.dailyFocusGoalMinutes ?? 120} onChange={(e) => save({ dailyFocusGoalMinutes: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>Daily task goal</Label>
                  <Input type="number" value={settings.dailyTaskGoal ?? 5} onChange={(e) => save({ dailyTaskGoal: Number(e.target.value) })} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>Pomodoro (min)</Label>
                    <Input type="number" value={settings.pomodoroFocusMin ?? 25} onChange={(e) => save({ pomodoroFocusMin: Number(e.target.value) })} />
                  </div>
                  <div>
                    <Label>Short break</Label>
                    <Input type="number" value={settings.pomodoroBreakMin ?? 5} onChange={(e) => save({ pomodoroBreakMin: Number(e.target.value) })} />
                  </div>
                  <div>
                    <Label>Long break</Label>
                    <Input type="number" value={settings.pomodoroLongBreakMin ?? 15} onChange={(e) => save({ pomodoroLongBreakMin: Number(e.target.value) })} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Tabs.Content>

          <Tabs.Content value="calendar">
            <Card>
              <CardContent className="pt-4 max-w-md">
                <Label>Week starts on</Label>
                <NativeSelect value={settings.weekStartsOn ?? 1} onChange={(e) => save({ weekStartsOn: Number(e.target.value) })}>
                  <option value={0}>Sunday</option>
                  <option value={1}>Monday</option>
                </NativeSelect>
              </CardContent>
            </Card>
          </Tabs.Content>

          <Tabs.Content value="data">
            <Card>
              <CardContent className="pt-4 space-y-5 max-w-md">
                <div>
                  <p className="text-sm font-medium mb-2">Export data</p>
                  <div className="flex flex-wrap gap-2">
                    {["tasks", "habits", "goals", "projects", "notes"].map((type) => (
                      <Button key={type} variant="secondary" size="sm" asChild>
                        <a href={`/api/export?type=${type}&format=json`}>
                          <Download className="h-3.5 w-3.5" /> {type}.json
                        </a>
                      </Button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {["tasks", "habits", "goals"].map((type) => (
                      <Button key={type} variant="ghost" size="sm" asChild>
                        <a href={`/api/export?type=${type}&format=csv`}>
                          <Download className="h-3.5 w-3.5" /> {type}.csv
                        </a>
                      </Button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Import tasks</p>
                  <label className="inline-flex items-center gap-2 text-sm rounded-lg border border-dashed border-border px-4 py-3 cursor-pointer hover:border-accent">
                    <Upload className="h-4 w-4" /> Upload CSV or JSON
                    <input type="file" accept=".csv,.json" className="hidden" onChange={handleImport} />
                  </label>
                </div>
              </CardContent>
            </Card>
            <div className="max-w-md mt-5">
              <ResetDataSection />
            </div>
          </Tabs.Content>

          <Tabs.Content value="integrations">
            <Card>
              <CardContent className="pt-4 space-y-3">
                <p className="text-xs text-muted mb-2">
                  These connectors are architected but not yet linked to live third-party accounts — LifeOS never fabricates synced data. Real integrations can be wired up via the interfaces in{" "}
                  <code className="bg-surface-2 px-1 rounded">src/lib/integrations</code>.
                </p>
                {["Google Calendar", "Outlook Calendar", "Google Tasks", "Notion", "Todoist", "WhatsApp", "Telegram Bot"].map((name) => (
                  <div key={name} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <span className="text-sm">{name}</span>
                    <span className="text-xs text-muted bg-surface-2 rounded-full px-2.5 py-1">Coming soon</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </Tabs.Content>

          <Tabs.Content value="privacy">
            <Card>
              <CardContent className="pt-4">
                <p className="text-sm text-muted leading-relaxed">
                  Your data is stored securely and only accessible to you. Passwords are hashed with bcrypt, sessions are signed JWTs, and all API routes require authentication. You can export, or permanently
                  reset (all or part of) your data at any time from the Data tab.
                </p>
              </CardContent>
            </Card>
          </Tabs.Content>
        </div>
      </Tabs.Root>
    </div>
  );
}
