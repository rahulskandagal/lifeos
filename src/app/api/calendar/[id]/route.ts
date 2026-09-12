import { NextResponse } from "next/server";
import { withAuth } from "@/lib/apiHandler";
import { CalendarRepo } from "@/lib/db/repositories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const PATCH = withAuth(async (req, { userId, params }) => {
  const body = await req.json();
  const event = CalendarRepo.updateEvent(userId, params.id, body);
  const conflicts = body.date && body.startTime && body.endTime ? CalendarRepo.detectConflicts(userId, body.date, body.startTime, body.endTime, params.id) : [];
  return NextResponse.json({ event, conflicts });
});

export const DELETE = withAuth(async (_req, { userId, params }) => {
  CalendarRepo.deleteEvent(userId, params.id);
  return NextResponse.json({ success: true });
});
