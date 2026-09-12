import { NextResponse } from "next/server";
import { withAuth } from "@/lib/apiHandler";
import { TasksRepo } from "@/lib/db/repositories";
import { computePriorityScore } from "@/lib/ai/priorityScoring";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withAuth(async (req, { userId }) => {
  const { searchParams } = new URL(req.url);
  const filters: any = {};
  if (searchParams.get("date")) filters.date = searchParams.get("date");
  if (searchParams.get("dateFrom")) filters.dateFrom = searchParams.get("dateFrom");
  if (searchParams.get("dateTo")) filters.dateTo = searchParams.get("dateTo");
  if (searchParams.get("status")) filters.status = searchParams.get("status")!.split(",");
  if (searchParams.get("priority")) filters.priority = searchParams.get("priority")!.split(",");
  if (searchParams.get("category")) filters.category = searchParams.get("category");
  if (searchParams.get("projectId")) filters.projectId = searchParams.get("projectId");
  if (searchParams.get("tag")) filters.tag = searchParams.get("tag");
  if (searchParams.get("search")) filters.search = searchParams.get("search");
  if (searchParams.get("overdue") === "true") filters.overdue = true;
  if (searchParams.get("completed") === "true") filters.completed = true;
  if (searchParams.get("completed") === "false") filters.completed = false;
  if (searchParams.get("topLevelOnly") === "false") filters.topLevelOnly = false;

  const tasks = TasksRepo.listTasks(userId, filters);
  return NextResponse.json({ tasks });
});

export const POST = withAuth(async (req, { userId }) => {
  const body = await req.json();
  if (!body.title || typeof body.title !== "string") {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }
  const task = TasksRepo.createTask(userId, body);
  const { score } = computePriorityScore(task);
  const updated = TasksRepo.updateTask(userId, task.id, { aiPriorityScore: score });
  return NextResponse.json({ task: updated }, { status: 201 });
});
