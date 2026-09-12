import { NextResponse } from "next/server";
import { withAuth } from "@/lib/apiHandler";
import { CalendarRepo } from "@/lib/db/repositories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withAuth(async (req, { userId }) => {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from") ?? new Date().toISOString().slice(0, 10);
  const to = searchParams.get("to") ?? from;
  return NextResponse.json({ events: CalendarRepo.listEvents(userId, from, to) });
});

export const POST = withAuth(async (req, { userId }) => {
  const body = await req.json();
  if (!body.title || !body.date || !body.startTime || !body.endTime) {
    return NextResponse.json({ error: "title, date, startTime, endTime are required" }, { status: 400 });
  }
  const conflicts = CalendarRepo.detectConflicts(userId, body.date, body.startTime, body.endTime);
  const event = CalendarRepo.createEvent(userId, body);
  return NextResponse.json({ event, conflicts }, { status: 201 });
});
