import { NextResponse } from "next/server";
import { withAuth } from "@/lib/apiHandler";
import { TasksRepo, HabitsRepo, GoalsRepo, ProjectsRepo, NotesRepo } from "@/lib/db/repositories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toCSV(rows: Record<string, any>[]): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: any) => {
    const s = v === null || v === undefined ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
    return `"${s.replace(/"/g, '""')}"`;
  };
  const lines = [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))];
  return lines.join("\n");
}

export const GET = withAuth(async (req, { userId }) => {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "tasks";
  const format = searchParams.get("format") ?? "json";

  let data: any[] = [];
  if (type === "tasks") data = TasksRepo.listTasks(userId, { topLevelOnly: false });
  else if (type === "habits") data = HabitsRepo.listHabits(userId, true);
  else if (type === "goals") data = GoalsRepo.listGoals(userId);
  else if (type === "projects") data = ProjectsRepo.listProjects(userId);
  else if (type === "notes") data = NotesRepo.listNotes(userId);
  else return NextResponse.json({ error: "Unknown export type" }, { status: 400 });

  if (format === "csv") {
    const flat = data.map((d) => {
      const copy: Record<string, any> = { ...d };
      delete copy.tags;
      delete copy.subtasks;
      delete copy.milestones;
      delete copy.logs;
      delete copy.members;
      delete copy.attachments;
      return copy;
    });
    const csv = toCSV(flat);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="lifeos-${type}.csv"`,
      },
    });
  }

  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="lifeos-${type}.json"`,
    },
  });
});
