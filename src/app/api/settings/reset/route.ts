import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/apiHandler";
import { resetUserData, RESET_SCOPES, scopeLabel } from "@/lib/db/repositories/reset";
import { ensureDefaultCategories } from "@/lib/db/repositories/taxonomy";
import { seedDemoDataForUser } from "@/lib/db/seedDemoData";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  // "all" wipes every category for this user; an array wipes only those.
  scope: z.union([z.literal("all"), z.array(z.enum(RESET_SCOPES)).min(1)]),
  // Only meaningful when scope === "all": repopulate with fresh demo data
  // right after wiping, instead of leaving the account blank.
  reseedDemoData: z.boolean().optional(),
});

export const POST = withAuth(async (req, { userId }) => {
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }
  const { scope, reseedDemoData } = parsed.data;

  const cleared = resetUserData(userId, scope);

  if (scope === "all") {
    ensureDefaultCategories(userId);
    if (reseedDemoData) {
      seedDemoDataForUser(userId);
    }
  }

  return NextResponse.json({
    success: true,
    cleared,
    clearedLabels: cleared.map(scopeLabel),
    reseeded: scope === "all" && !!reseedDemoData,
  });
});
