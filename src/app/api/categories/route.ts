import { NextResponse } from "next/server";
import { withAuth } from "@/lib/apiHandler";
import { TaxonomyRepo } from "@/lib/db/repositories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withAuth(async (_req, { userId }) => {
  return NextResponse.json({ categories: TaxonomyRepo.listCategories(userId), tags: TaxonomyRepo.listTags(userId) });
});

export const POST = withAuth(async (req, { userId }) => {
  const body = await req.json();
  if (!body.name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  const category = TaxonomyRepo.createCategory(userId, body);
  return NextResponse.json({ category }, { status: 201 });
});

export const DELETE = withAuth(async (req, { userId }) => {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
  TaxonomyRepo.deleteCategory(userId, id);
  return NextResponse.json({ success: true });
});
