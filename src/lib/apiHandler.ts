import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/session";

type Handler = (req: NextRequest, ctx: { userId: string; params: Record<string, string> }) => Promise<NextResponse | Response>;

export function withAuth(handler: Handler) {
  return async (req: NextRequest, routeCtx?: { params?: Promise<Record<string, string>> | Record<string, string> }) => {
    try {
      const userId = await requireUserId();
      const rawParams = routeCtx?.params;
      const params = rawParams && typeof (rawParams as any).then === "function" ? await (rawParams as Promise<Record<string, string>>) : ((rawParams as Record<string, string>) ?? {});
      return await handler(req, { userId, params });
    } catch (err: any) {
      if (err?.name === "AuthError") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      console.error(err);
      return NextResponse.json({ error: err?.message ?? "Internal server error" }, { status: 400 });
    }
  };
}
