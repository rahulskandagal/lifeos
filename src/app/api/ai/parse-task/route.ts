import { NextResponse } from "next/server";
import { withAuth } from "@/lib/apiHandler";
import { parseNaturalLanguageTask } from "@/lib/ai/nlTaskParser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withAuth(async (req) => {
  const body = await req.json();
  if (!body.text) return NextResponse.json({ error: "text is required" }, { status: 400 });
  const parsed = parseNaturalLanguageTask(body.text);
  return NextResponse.json({ parsed });
});
