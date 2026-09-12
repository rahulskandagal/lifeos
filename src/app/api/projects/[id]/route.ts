import { NextResponse } from "next/server";
import { withAuth } from "@/lib/apiHandler";
import { ProjectsRepo, TasksRepo } from "@/lib/db/repositories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withAuth(async (_req, { params }) => {
  const project = ProjectsRepo.getProjectById(params.id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const tasks = TasksRepo.listTasks(project.userId, { projectId: params.id, topLevelOnly: false });
  return NextResponse.json({ project, tasks });
});

export const PATCH = withAuth(async (req, { userId, params }) => {
  const body = await req.json();
  return NextResponse.json({ project: ProjectsRepo.updateProject(userId, params.id, body) });
});

export const DELETE = withAuth(async (_req, { userId, params }) => {
  ProjectsRepo.deleteProject(userId, params.id);
  return NextResponse.json({ success: true });
});
