import { NextResponse } from "next/server";
import { withAuth } from "@/lib/apiHandler";
import { TasksRepo, HabitsRepo, CalendarRepo, UsersRepo } from "@/lib/db/repositories";
import { planDay, detectOverload } from "@/lib/ai/dayPlanner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withAuth(async (req, { userId }) => {
  const body = await req.json().catch(() => ({}));
  const date = body.date ?? new Date().toISOString().slice(0, 10);

  const tasks = TasksRepo.listTasks(userId, { date, completed: false });
  const habits = HabitsRepo.listHabits(userId);
  const events = CalendarRepo.listEvents(userId, date, date);
  const settings = UsersRepo.getUserSettings(userId);

  const blocks = planDay({ tasks, habits, fixedEvents: events, settings });

  const workStart = settings.workingHoursStart;
  const workEnd = settings.workingHoursEnd;
  const [wsH, wsM] = workStart.split(":").map(Number);
  const [weH, weM] = workEnd.split(":").map(Number);
  const availableMinutes = weH * 60 + weM - (wsH * 60 + wsM);
  const overload = detectOverload(tasks, availableMinutes);

  return NextResponse.json({ blocks, overload });
});
