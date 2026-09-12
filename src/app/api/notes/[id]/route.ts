import { NextResponse } from "next/server";
import { withAuth } from "@/lib/apiHandler";
import { NotesRepo } from "@/lib/db/repositories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const PATCH = withAuth(async (req, { userId, params }) => {
  const body = await req.json();
  return NextResponse.json({ note: NotesRepo.updateNote(userId, params.id, body) });
});

export const DELETE = withAuth(async (_req, { userId, params }) => {
  NotesRepo.deleteNote(userId, params.id);
  return NextResponse.json({ success: true });
});
