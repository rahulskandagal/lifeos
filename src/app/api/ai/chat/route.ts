import { NextResponse } from "next/server";
import { withAuth } from "@/lib/apiHandler";
import { AIRepo } from "@/lib/db/repositories";
import { handleChatMessage } from "@/lib/ai/chatEngine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withAuth(async (_req, { userId }) => {
  return NextResponse.json({ messages: AIRepo.listAIInteractions(userId) });
});

export const POST = withAuth(async (req, { userId }) => {
  const body = await req.json();
  const message: string = body.message;
  if (!message?.trim()) return NextResponse.json({ error: "message is required" }, { status: 400 });

  AIRepo.addAIInteraction(userId, "user", message);
  const result = await handleChatMessage(userId, message);
  AIRepo.addAIInteraction(userId, "assistant", result.reply, result.actions);

  return NextResponse.json(result);
});
