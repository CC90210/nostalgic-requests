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

export function getAdminData(): SupabaseClient {
  if (cached) return cached;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase admin env vars missing");
  }
  const supa = createSupabase(supabaseUrl, supabaseServiceKey);

  if (
    process.env.EMPIRE_DATA_BACKEND === "turso_cloud" &&
    process.env.TURSO_DATABASE_URL &&
    process.env.TURSO_AUTH_TOKEN
  ) {
    const turso = createTursoPostgrest(
      createLibsql({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
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
