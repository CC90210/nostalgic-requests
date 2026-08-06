/** Server-component session resolution under Turso auth mode. */
import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession } from "./turso-auth";

export async function getTursoUser(): Promise<{ id: string; email: string } | null> {
  if (process.env.EMPIRE_AUTH_BACKEND !== "turso" || !process.env.AUTH_SESSION_SECRET) {
    return null;
  }
  const store = await cookies();
  const session = verifySession(store.get(SESSION_COOKIE)?.value);
  return session ? { id: session.sub, email: session.email } : null;
}

export function tursoAuthMode(): boolean {
  return process.env.EMPIRE_AUTH_BACKEND === "turso" && !!process.env.AUTH_SESSION_SECRET;
}
