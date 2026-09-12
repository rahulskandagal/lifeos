import { NextResponse } from "next/server";
import { withAuth } from "@/lib/apiHandler";
import { TasksRepo } from "@/lib/db/repositories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/);
  if (!lines.length) return [];
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => (obj[h] = values[i] ?? ""));
    return obj;
  });
}

// Imports tasks from CSV or JSON (section 43). Architecture leaves room for
// future connectors (Google Tasks, Todoist, Notion) to feed the same
// createTask() pipeline — see src/lib/integrations/README.md.
export const POST = withAuth(async (req, { userId }) => {
  const body = await req.json();
  const { content, format } = body as { content: string; format: "csv" | "json" };
  if (!content) return NextResponse.json({ error: "content is required" }, { status: 400 });

  let rows: any[] = [];
  try {
    rows = format === "csv" ? parseCSV(content) : JSON.parse(content);
  } catch {
    return NextResponse.json({ error: "Failed to parse import content" }, { status: 400 });
  }

  const created = [];
  for (const row of rows) {
    if (!row.title) continue;
    created.push(
      TasksRepo.createTask(userId, {
        title: row.title,
        description: row.description,
        priority: row.priority,
        category: row.category,
        date: row.date,
        estimatedMinutes: row.estimatedMinutes ? Number(row.estimatedMinutes) : undefined,
      })
    );
  }

  return NextResponse.json({ imported: created.length, tasks: created });
});
