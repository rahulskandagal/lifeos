import { NextResponse } from "next/server";
import { withAuth } from "@/lib/apiHandler";
import { HabitsRepo } from "@/lib/db/repositories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withAuth(async (_req, { userId }) => {
  return NextResponse.json({ habits: HabitsRepo.listHabits(userId) });
});

export const POST = withAuth(async (req, { userId }) => {
  const body = await req.json();
  if (!body.name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  const habit = HabitsRepo.createHabit(userId, body);
  return NextResponse.json({ habit }, { status: 201 });
});
