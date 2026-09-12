import { NextResponse } from "next/server";
import { withAuth } from "@/lib/apiHandler";
import { TasksRepo } from "@/lib/db/repositories";
import { computePriorityScore } from "@/lib/ai/priorityScoring";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withAuth(async (_req, { params }) => {
  const task = TasksRepo.getTaskById(params.id);
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ task });
});

export const PATCH = withAuth(async (req, { userId, params }) => {
  const body = await req.json();
  let task = TasksRepo.updateTask(userId, params.id, body);
  if (body.priority || body.date || body.estimatedMinutes !== undefined) {
    const { score } = computePriorityScore(task);
    task = TasksRepo.updateTask(userId, params.id, { aiPriorityScore: score });
  }
  return NextResponse.json({ task });
});

export const DELETE = withAuth(async (_req, { userId, params }) => {
  TasksRepo.deleteTask(userId, params.id);
  return NextResponse.json({ success: true });
});
