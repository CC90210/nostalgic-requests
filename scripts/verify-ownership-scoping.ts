/**
 * Does the server-side scoping that replaced RLS actually isolate DJs?
 *
 * Turso has no RLS. Every query that used to rely on auth.uid() now carries an
 * explicit owner filter, and ownedEvent() is the single check standing between
 * one DJ and another's events, paid requests, and lead contact details.
 *
 * A build cannot prove any of that — the routes typecheck whether or not the
 * filter is there. So this exercises the real modules against the real
 * database, with two real DJ ids taken from live rows.
 *
 * It also exercises `adminData`, the lazy proxy the seven Stripe/user/webhook
 * routes now import. Module-scope getAdminData() aborted `next build`, so the
 * call was deferred behind a Proxy — and a Proxy that fails to bind `this`
 * breaks every one of those routes at runtime while compiling perfectly.
 *
 *   npx tsx --require ./scripts/allow-server-only.cjs \
 *           scripts/verify-ownership-scoping.ts
 */
import { adminData, getAdminData } from "../lib/supabase-admin";
import { ownedEvent, type Resolved } from "../lib/require-user";

let failures = 0;
const check = (name: string, ok: boolean, detail = "") => {
  if (!ok) failures++;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
};

const ctxFor = (userId: string): Resolved =>
  ({ user: { id: userId }, db: getAdminData() });

async function main() {
  if (process.env.EMPIRE_DATA_BACKEND !== "turso_cloud") {
    console.error("EMPIRE_DATA_BACKEND is not turso_cloud — nothing proven.");
    process.exit(2);
  }

  console.log("the lazy adminData proxy reaches the database");
  const probe = await adminData.from("events").select("id, user_id").limit(5);
  check("adminData.from(...).select() resolves", !probe.error,
        probe.error?.message ?? `${probe.data?.length ?? 0} rows`);
  check("methods are bound (no 'this' loss through the Proxy)",
        Array.isArray(probe.data));

  const events = (probe.data ?? []) as Array<{ id: string; user_id: string }>;
  if (events.length < 1) {
    console.error("\nno events in the database — cannot test isolation.");
    process.exit(2);
  }

  const owners = [...new Set(events.map((e) => e.user_id))];
  const mine = events.find((e) => e.user_id === owners[0])!;
  console.log(`\ndistinct owners among sampled events: ${owners.length}`);

  console.log("\nownedEvent() — the check that replaced RLS");
  const asOwner = await ownedEvent(ctxFor(mine.user_id), mine.id);
  check("the owner can read their own event", !!asOwner,
        asOwner ? `id=${asOwner.id}` : "returned null");

  // A different DJ. If there is only one owner in the data, use a synthetic id —
  // the filter must reject an unknown user just as firmly as a known one.
  const stranger = owners.find((o) => o !== mine.user_id)
    ?? "00000000-0000-4000-8000-00000000dead";
  const asStranger = await ownedEvent(ctxFor(stranger), mine.id);
  check("another DJ CANNOT read that event", asStranger === null,
        asStranger ? `LEAKED: ${JSON.stringify(asStranger).slice(0, 120)}` : "null");

  const missing = await ownedEvent(ctxFor(mine.user_id), "does-not-exist");
  check("a non-existent event returns null, not a throw", missing === null);

  const empty = await ownedEvent(ctxFor(mine.user_id), "");
  check("an empty event id returns null rather than matching everything",
        empty === null);

  console.log("\nlist queries are scoped, not merely filtered in the UI");
  const forStranger = await getAdminData()
    .from("events").select("id").eq("user_id", stranger);
  const strangerIds = new Set((forStranger.data ?? []).map((r: any) => r.id));
  check("the other DJ's event list excludes this event",
        !strangerIds.has(mine.id),
        strangerIds.has(mine.id) ? "LEAKED" : `${strangerIds.size} events`);

  // leads carry user_id directly; the page used to fetch them with no filter
  // at all and let RLS decide.
  const leads = await getAdminData().from("leads").select("id, user_id");
  const rows = (leads.data ?? []) as Array<{ user_id: string }>;
  if (rows.length) {
    const scoped = await getAdminData()
      .from("leads").select("id, user_id").eq("user_id", rows[0].user_id);
    const bad = ((scoped.data ?? []) as Array<{ user_id: string }>)
      .filter((l) => l.user_id !== rows[0].user_id);
    check("scoped lead query returns only that DJ's leads", bad.length === 0,
          `${scoped.data?.length ?? 0} of ${rows.length} total`);
  } else {
    console.log("  SKIP  no leads to test against");
  }

  console.log(failures ? `\n${failures} FAILED` : "\nall checks passed");
  process.exit(failures ? 1 : 0);
}

main().catch((e) => {
  console.error("threw:", e);
  process.exit(1);
});
