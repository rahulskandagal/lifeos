import { NextResponse } from "next/server";
import { withAuth } from "@/lib/apiHandler";
import { JournalRepo } from "@/lib/db/repositories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withAuth(async (req, { userId }) => {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  if (date) {
    return NextResponse.json({ journal: JournalRepo.getJournalByDate(userId, date) ?? null });
  }
  return NextResponse.json({ journals: JournalRepo.listJournal(userId) });
});

export const PUT = withAuth(async (req, { userId }) => {
  const body = await req.json();
  if (!body.date) return NextResponse.json({ error: "date is required" }, { status: 400 });
  const journal = JournalRepo.upsertJournal(userId, body.date, body);
  return NextResponse.json({ journal });
});
