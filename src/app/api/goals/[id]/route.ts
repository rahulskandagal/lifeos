import { NextResponse } from "next/server";
import { withAuth } from "@/lib/apiHandler";
import { GoalsRepo } from "@/lib/db/repositories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const PATCH = withAuth(async (req, { userId, params }) => {
  const body = await req.json();
  if (body.action === "add-milestone") {
    return NextResponse.json({ goal: GoalsRepo.addMilestone(params.id, body.title, body.dueDate) });
  }
  if (body.action === "toggle-milestone") {
    return NextResponse.json({ goal: GoalsRepo.toggleMilestone(params.id, body.milestoneId) });
  }
  return NextResponse.json({ goal: GoalsRepo.updateGoal(userId, params.id, body) });
});

export const DELETE = withAuth(async (_req, { userId, params }) => {
  GoalsRepo.deleteGoal(userId, params.id);
  return NextResponse.json({ success: true });
});
