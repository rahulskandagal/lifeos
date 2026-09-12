import { NextResponse } from "next/server";
import { withAuth } from "@/lib/apiHandler";
import { NotesRepo } from "@/lib/db/repositories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withAuth(async (req, { userId }) => {
  const { searchParams } = new URL(req.url);
  return NextResponse.json({
    notes: NotesRepo.listNotes(userId, {
      search: searchParams.get("search") ?? undefined,
      pinned: searchParams.get("pinned") === "true" ? true : undefined,
      favorite: searchParams.get("favorite") === "true" ? true : undefined,
    }),
  });
});

export const POST = withAuth(async (req, { userId }) => {
  const body = await req.json();
  if (!body.title) return NextResponse.json({ error: "Title is required" }, { status: 400 });
  const note = NotesRepo.createNote(userId, body);
  return NextResponse.json({ note }, { status: 201 });
});
