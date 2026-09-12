import { NextResponse } from "next/server";
import { withAuth } from "@/lib/apiHandler";
import { HabitsRepo } from "@/lib/db/repositories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const PATCH = withAuth(async (req, { userId, params }) => {
  const body = await req.json();
  if (body.action === "toggle-log") {
    return NextResponse.json({ habit: HabitsRepo.toggleHabitLog(userId, params.id, body.date) });
  }
  return NextResponse.json({ habit: HabitsRepo.updateHabit(userId, params.id, body) });
});

export const DELETE = withAuth(async (_req, { userId, params }) => {
  HabitsRepo.deleteHabit(userId, params.id);
  return NextResponse.json({ success: true });
});
