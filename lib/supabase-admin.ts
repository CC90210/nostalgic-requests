/**
 * Server-only admin data client with the Turso data-plane switch.
 *
 * Split out of lib/supabase.ts on purpose: that file is in the CLIENT bundle
 * graph (auth-context imports it), and any reference to @libsql/client from a
 * client-reachable module — even a lazy require — gets traced by the bundler
 * and fails the build on Node built-ins ("Can't resolve 'fs'"). This module is
 * import "server-only", so the boundary is compiler-enforced, not a comment.
 */
import "server-only";
import { createClient as createSupabase, type SupabaseClient } from "@supabase/supabase-js";
import { createClient as createLibsql } from "@libsql/client";
import { createTursoPostgrest } from "./turso-postgrest";
import { r2Configured, r2StorageSurface } from "@/lib/r2-storage";

let cached: SupabaseClient | null = null;

/**
 * Stand-in for the Supabase client once the project is cancelled and its keys
 * are gone. The Turso proxy below only ever forwards `auth`/unknown props to
 * this target, so reaching it means a caller wants something Turso does not
 * serve. Throw loudly there rather than returning a client that quietly
 * resolves to null — lib/supabase.ts already has a mock that does the latter,
 * and a silent empty read is exactly how a dead backend looks healthy.
 */
function absentSupabase(): SupabaseClient {
  return new Proxy({} as SupabaseClient, {
    get(_t, prop) {
      throw new Error(
        `Supabase is not configured (property "${String(prop)}" requested). ` +
          `Under EMPIRE_DATA_BACKEND=turso_cloud only .from()/.storage/.rpc() ` +
          `are served; this call site still needs porting.`,
      );
    },
  });
}

export function getAdminData(): SupabaseClient {
  if (cached) return cached;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const tursoReady =
    process.env.EMPIRE_DATA_BACKEND === "turso_cloud" &&
    !!process.env.TURSO_DATABASE_URL &&
    !!process.env.TURSO_AUTH_TOKEN;

  // Supabase creds are optional ONLY when Turso is fully wired. Otherwise this
  // still has to fail closed — a missing key must not degrade into empty reads.
  if (!supabaseUrl || !supabaseServiceKey) {
    if (!tursoReady) {
      throw new Error(
        "Supabase admin env vars missing and EMPIRE_DATA_BACKEND is not " +
          "turso_cloud (or TURSO_DATABASE_URL/TURSO_AUTH_TOKEN are unset) — " +
          "no data backend is reachable.",
      );
    }
  }
  const supa =
    supabaseUrl && supabaseServiceKey
      ? createSupabase(supabaseUrl, supabaseServiceKey)
      : absentSupabase();

  if (tursoReady) {
    const turso = createTursoPostgrest(
      createLibsql({
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN!,
      }),
    );
    cached = new Proxy(supa, {
      get(target, prop, receiver) {
        if (prop === "from") return (table: string) => turso.from(table);
        // rpc fails closed — zero rpc call sites today; the guard matches the
        // fleet pattern so a future call cannot split writes across databases.
        if (prop === "rpc") {
          return (name: string) =>
            Promise.resolve({
              data: null, count: null, status: 400, statusText: "Bad Request",
              error: {
                message: `rpc("${name}") is blocked under EMPIRE_DATA_BACKEND=turso_cloud — ` +
                  `PL/pgSQL did not migrate. Port the RPC before calling it.`,
                code: "TURSO_RPC_BLOCKED", details: null, hint: null,
              },
            });
        }
        // Turso has no object store, so .storage routes to R2 when configured.
        // Without this it passed through to Supabase regardless of the data
        // flag — the same gap that kept storage a hard dependency.
        if (prop === "storage" && r2Configured()) {
          return r2StorageSurface();
        }
        return Reflect.get(target, prop, receiver);
      },
    }) as SupabaseClient;
    return cached;
  }
  cached = supa;
  return cached;
}

/**
 * Lazy handle for module-scope use.
 *
 * `const supabase = getAdminData()` at the top of a route runs during
 * `next build`'s page-data collection, where no env vars exist — so the
 * fail-closed error in getAdminData() aborts the build rather than a request.
 * Resolution is deferred to the first property access, which only happens
 * inside a handler.
 *
 * Methods are bound to the real client: supabase-js relies on `this`, and
 * returning them unbound would break every call through the proxy.
 */
export const adminData: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getAdminData() as unknown as Record<string | symbol, unknown>;
    const value = client[prop];
    return typeof value === "function" ? value.bind(client) : value;
  },
});
