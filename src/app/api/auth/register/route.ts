import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { createUser, getUserByEmail } from "@/lib/db/repositories/users";
import { ensureDefaultCategories } from "@/lib/db/repositories/taxonomy";
import { seedDemoDataForUser } from "@/lib/db/seedDemoData";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  seedDemoData: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }
    const { name, email, password, seedDemoData } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    if (getUserByEmail(normalizedEmail)) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = createUser({ name, email: normalizedEmail, passwordHash });
    ensureDefaultCategories(user.id);

    if (seedDemoData) {
      seedDemoDataForUser(user.id);
    }

    return NextResponse.json({ success: true, userId: user.id });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong creating your account." }, { status: 500 });
  }
}
