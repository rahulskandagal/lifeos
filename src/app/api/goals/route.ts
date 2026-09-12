import { NextResponse } from "next/server";
import { withAuth } from "@/lib/apiHandler";
import { GoalsRepo } from "@/lib/db/repositories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withAuth(async (req, { userId }) => {
  const { searchParams } = new URL(req.url);
  const term = searchParams.get("term") as any;
  return NextResponse.json({ goals: GoalsRepo.listGoals(userId, term ?? undefined) });
});

export const POST = withAuth(async (req, { userId }) => {
  const body = await req.json();
  if (!body.title) return NextResponse.json({ error: "Title is required" }, { status: 400 });
  const goal = GoalsRepo.createGoal(userId, body);
  return NextResponse.json({ goal }, { status: 201 });
});
