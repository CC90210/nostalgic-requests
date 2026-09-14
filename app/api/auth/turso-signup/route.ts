/**
 * Account creation on the Turso auth path — the missing half of the migration.
 *
 * WHY THIS EXISTS. When the data plane moved to Turso, `signUp` in
 * lib/auth-context.tsx was gated off: creating a SUPABASE auth user that
 * Turso-mode login could never read back would have stranded the account. The
 * gate shipped as a placeholder and the replacement never did, so the built
 * client collapsed signUp to an unconditional "signups are paused" error and
 * nobody could register at all. This route is that replacement.
 *
 * It is the exact inverse of lib/turso-auth.ts `verifyPassword`: that reads
 * `_supabase_auth_users` by lower(email) with a bcrypt compare, so this writes
 * a row that query can find, with a hash it can verify (bcrypt cost 10, the
 * same cost as the migrated Supabase hashes).
 *
 * Atomicity matters here. An auth user without a dj_profiles row is an account
 * that can log in and then breaks on every page that reads a profile, and the
 * self-heal path that "fixes" it names the DJ "New DJ". Both inserts therefore
 * go through one libSQL write batch: both land or neither does.
 *
 * The duplicate check below is a check-then-insert and so cannot be relied on
 * alone. What actually closes the race is the unique index on lower(email),
 * applied to the live database on 2026-09-13 and verified there by watching it
 * reject a colliding insert. The check stays because it gives the ordinary
 * duplicate a clear 409 without burning a bcrypt hash; the catch at the bottom
 * turns the index's constraint error into that same 409 for the race that gets
 * past it.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@libsql/client/web";
import { hash } from "bcryptjs";
import { SESSION_COOKIE, signSession, tursoAuthActive } from "@/lib/turso-auth";
import { getResend } from "@/lib/resend";
import WelcomeEmail from "@/emails/WelcomeEmail";

export const runtime = "nodejs";

const SESSION_TTL_S = 60 * 60 * 24 * 7; // 7 days — matches turso-auth.ts
const BCRYPT_COST = 10;                 // matches the migrated $2a$10$ hashes
const MIN_PASSWORD = 6;                 // matches the signup form's own rule

const BUCKETS = new Map<string, number[]>();
function rateLimited(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const arr = (BUCKETS.get(key) ?? []).filter((t) => now - t < windowMs);
  if (arr.length >= max) { BUCKETS.set(key, arr); return true; }
  arr.push(now); BUCKETS.set(key, arr); return false;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  if (!tursoAuthActive()) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(`turso-signup:${ip}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many signups from this connection — try again later." },
      { status: 429 });
  }

  let body: {
    email?: string; password?: string; djName?: string;
    phone?: string; fullName?: string | null;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const djName = String(body.djName ?? "").trim();
  const phone = String(body.phone ?? "").trim();
  const fullName = body.fullName ? String(body.fullName).trim() : null;

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  if (password.length < MIN_PASSWORD) {
    return NextResponse.json(
      { error: `Password must be at least ${MIN_PASSWORD} characters.` }, { status: 400 });
  }
  if (password.length > 200) {
    // bcrypt only reads the first 72 bytes; a megabyte password is a CPU
    // exhaustion vector on a Worker, not a stronger secret.
    return NextResponse.json({ error: "Password is too long." }, { status: 400 });
  }
  if (!djName) {
    return NextResponse.json({ error: "Enter your DJ name." }, { status: 400 });
  }

  const url = process.env.TURSO_DATABASE_URL;
  const token = process.env.TURSO_AUTH_TOKEN;
  if (!url || !token) {
    return NextResponse.json({ error: "auth backend unavailable" }, { status: 503 });
  }
  const client = createClient({ url, authToken: token });

  try {
    const existing = await client.execute({
      sql: `SELECT id FROM "_supabase_auth_users"
            WHERE lower(email) = ? AND deleted_at IS NULL LIMIT 1`,
      args: [email],
    });
    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: "This email is already registered. Please sign in." }, { status: 409 });
    }

    const userId = crypto.randomUUID();
    const now = new Date().toISOString();
    const encrypted = await hash(password, BCRYPT_COST);

    // One batch, one transaction: an auth user without a profile is a broken
    // account, and a profile without an auth user is an orphan row.
    await client.batch(
      [
        {
          sql: `INSERT INTO "_supabase_auth_users"
                  (id, email, encrypted_password, email_confirmed_at, created_at,
                   updated_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
                   is_anonymous)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '0')`,
          args: [
            userId, email, encrypted, now, now, now, now,
            JSON.stringify({ provider: "email", providers: ["email"] }),
            JSON.stringify({
              sub: userId, email, dj_name: djName,
              phone: phone || null, full_name: fullName,
              email_verified: true, phone_verified: false,
            }),
          ],
        },
        {
          // id / created_at / updated_at have column defaults — let the DB set
          // them rather than inventing a second uuid format here.
          sql: `INSERT INTO "dj_profiles" (user_id, email, dj_name, full_name, phone)
                VALUES (?, ?, ?, ?, ?)`,
          args: [userId, email, djName, fullName, phone || null],
        },
      ],
      "write",
    );

    const profileRes = await client.execute({
      sql: `SELECT id, user_id, email, dj_name, full_name, phone, bio, profile_image_url
            FROM "dj_profiles" WHERE user_id = ? LIMIT 1`,
      args: [userId],
    });
    const profile = profileRes.rows[0] ?? null;

    const res = NextResponse.json({
      ok: true,
      user: { id: userId, email },
      profile,
    });
    res.cookies.set({
      name: SESSION_COOKIE,
      value: signSession({ sub: userId, email, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_S }),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_TTL_S,
    });

    // Welcome email is best-effort: a mail failure must not fail a signup that
    // already committed. Logged, never swallowed silently.
    const resend = getResend();
    if (resend) {
      resend.emails
        .send({
          from: "Nostalgic <onboarding@resend.dev>",
          to: email,
          subject: "Welcome to Nostalgic Requests!",
          react: WelcomeEmail({ djName }),
        })
        .catch((err: any) =>
          console.error("[Turso Signup] Welcome email failed:", err?.message));
    }

    return res;
  } catch (err: any) {
    const msg = String(err?.message ?? err);

    // Losing the race against the unique index is not a server error — it means
    // someone registered this address a moment ago. Answer exactly as the
    // ordinary duplicate path does. Without this branch the index turns the
    // loser of a race into a 500, telling a would-be DJ their account could not
    // be created when in fact one now exists on that address.
    if (/SQLITE_CONSTRAINT|UNIQUE constraint failed/i.test(msg)) {
      console.warn("[Turso Signup] Unique constraint hit (duplicate or race):", msg);
      return NextResponse.json(
        { error: "This email is already registered. Please sign in." }, { status: 409 });
    }

    // Log the detail, return a generic message: the raw driver error names
    // tables and constraints the caller has no business seeing.
    console.error("[Turso Signup] Failed:", msg);
    return NextResponse.json({ error: "Could not create your account." }, { status: 500 });
  }
}
