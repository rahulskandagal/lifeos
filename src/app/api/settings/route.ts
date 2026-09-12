import { NextResponse } from "next/server";
import { withAuth } from "@/lib/apiHandler";
import { UsersRepo } from "@/lib/db/repositories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withAuth(async (_req, { userId }) => {
  const user = UsersRepo.getUserById(userId);
  const settings = UsersRepo.getUserSettings(userId);
  return NextResponse.json({ user, settings });
});

export const PATCH = withAuth(async (req, { userId }) => {
  const body = await req.json();
  const { profile, ...settingsPatch } = body;
  if (profile) {
    UsersRepo.updateUser(userId, profile);
  }
  const settings = Object.keys(settingsPatch).length ? UsersRepo.updateUserSettings(userId, settingsPatch) : UsersRepo.getUserSettings(userId);
  return NextResponse.json({ user: UsersRepo.getUserById(userId), settings });
});
