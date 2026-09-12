import { NextResponse } from "next/server";
import { withAuth } from "@/lib/apiHandler";
import { breakdownTask } from "@/lib/ai/taskBreakdown";
import { TasksRepo } from "@/lib/db/repositories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withAuth(async (req, { userId }) => {
  const body = await req.json();
  if (!body.title) return NextResponse.json({ error: "title is required" }, { status: 400 });
  const subtasks = breakdownTask(body.title);

  if (body.apply) {
    const parentId = body.parentTaskId ?? TasksRepo.createTask(userId, { title: body.title, priority: "high" }).id;
    const created = subtasks.map((s) => {
      const date = new Date(Date.now() + s.daysFromNow * 86400000).toISOString().slice(0, 10);
      return TasksRepo.createTask(userId, { title: s.title, parentTaskId: parentId, priority: s.priority, estimatedMinutes: s.estimatedMinutes, date });
    });
    return NextResponse.json({ subtasks, created, parentTaskId: parentId });
  }

  return NextResponse.json({ subtasks });
});
