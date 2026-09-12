import { NextResponse } from "next/server";
import { withAuth } from "@/lib/apiHandler";
import { ProjectsRepo } from "@/lib/db/repositories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withAuth(async (_req, { userId }) => {
  return NextResponse.json({ projects: ProjectsRepo.listProjects(userId) });
});

export const POST = withAuth(async (req, { userId }) => {
  const body = await req.json();
  if (!body.name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  const project = ProjectsRepo.createProject(userId, body);
  return NextResponse.json({ project }, { status: 201 });
});
