import { NextResponse } from "next/server";
import { withAuth } from "@/lib/apiHandler";
import { FocusRepo, GamificationRepo } from "@/lib/db/repositories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withAuth(async (req, { userId }) => {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;
  return NextResponse.json({ sessions: FocusRepo.listFocusSessions(userId, from, to), focusMinutesToday: FocusRepo.focusMinutesToday(userId) });
});

export const POST = withAuth(async (req, { userId }) => {
  const body = await req.json();
  if (body.action === "end") {
    const session = FocusRepo.endFocusSession(userId, body.id, { actualMinutes: body.actualMinutes, completed: body.completed, interrupted: body.interrupted });
    if (body.completed) {
      GamificationRepo.addXP(userId, Math.round((body.actualMinutes ?? 0) / 2));
      GamificationRepo.touchActivityStreak(userId);
      GamificationRepo.checkAndAwardBadges(userId);
    }
    return NextResponse.json({ session });
  }
  const session = FocusRepo.startFocusSession(userId, body);
  return NextResponse.json({ session }, { status: 201 });
});
