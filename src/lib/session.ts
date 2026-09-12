import { auth } from "@/lib/auth";

export async function requireUserId(): Promise<string> {
  const session = await auth();
  const id = (session?.user as any)?.id;
  if (!id) throw new AuthError();
  return id;
}

export class AuthError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "AuthError";
  }
}
