import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Singleton instances
let supabaseInstance: SupabaseClient | null = null;
let supabaseAdminInstance: SupabaseClient | null = null;

/**
 * Check if we're in a build/prerender environment without env vars
 */
function isBuildTime(): boolean {
  return (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_URL === '' ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === ''
  );
}

/**
 * Get Supabase client for client-side and general use
 * Returns null during build time to prevent errors
 */
export function getSupabase(): SupabaseClient {
  // Return cached instance if available
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // During build time, return a mock that won't crash
  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase env vars not available - returning mock client');
    // Return a mock client that returns empty data
    return createMockClient();
  }

  supabaseInstance = createClient(supabaseUrl, supabaseKey);
  return supabaseInstance;
}

/**
 * Get Supabase admin client for server-side operations
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (supabaseAdminInstance) {
    return supabaseAdminInstance;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('Supabase admin env vars not available - returning mock client');
    return createMockClient();
  }

  const supa = createClient(supabaseUrl, supabaseServiceKey);

  // Data-plane switch (staged Supabase→Turso migration): with
  // EMPIRE_DATA_BACKEND=turso_cloud and a Turso pair present, table
  // reads/writes route to Turso; auth/storage stay on Supabase. Rollback =
  // delete the env var. Server-side only — this factory never runs in the
  // browser, and Turso credentials must never reach one.
  if (
    process.env.EMPIRE_DATA_BACKEND === 'turso_cloud' &&
    process.env.TURSO_DATABASE_URL &&
    process.env.TURSO_AUTH_TOKEN
  ) {
    // Lazy requires keep @libsql/client out of the client bundle entirely.
    const { createClient: createLibsql } = require('@libsql/client') as
      typeof import('@libsql/client');
    const { createTursoPostgrest } = require('./turso-postgrest') as
      typeof import('./turso-postgrest');
    const turso = createTursoPostgrest(
      createLibsql({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
      }),
    );
    supabaseAdminInstance = new Proxy(supa, {
      get(target, prop, receiver) {
        if (prop === 'from') return (table: string) => turso.from(table);
        // rpc fails closed — this app has zero rpc call sites today, but the
        // guard matches the fleet pattern (command-center, breeze) so a future
        // rpc call cannot silently split writes across databases.
        if (prop === 'rpc') {
          return (name: string) =>
            Promise.resolve({
              data: null,
              count: null,
              status: 400,
              statusText: 'Bad Request',
              error: {
                message:
                  `rpc("${name}") is blocked under EMPIRE_DATA_BACKEND=turso_cloud — ` +
                  `PL/pgSQL did not migrate. Port the RPC before calling it.`,
                code: 'TURSO_RPC_BLOCKED',
                details: null,
                hint: null,
              },
            });
        }
        return Reflect.get(target, prop, receiver);
      },
    }) as SupabaseClient;
    return supabaseAdminInstance;
  }

  supabaseAdminInstance = supa;
  return supabaseAdminInstance;
}

/**
 * Create a mock client that returns empty results
 * This prevents build-time crashes
 */
function createMockClient(): SupabaseClient {
  const mockResponse = {
    data: null,
    error: null,
    count: null,
    status: 200,
    statusText: 'OK',
  };

  const mockQueryBuilder: any = {
    select: () => mockQueryBuilder,
    insert: () => mockQueryBuilder,
    update: () => mockQueryBuilder,
    delete: () => mockQueryBuilder,
    eq: () => mockQueryBuilder,
    neq: () => mockQueryBuilder,
    gt: () => mockQueryBuilder,
    gte: () => mockQueryBuilder,
    lt: () => mockQueryBuilder,
    lte: () => mockQueryBuilder,
    like: () => mockQueryBuilder,
    ilike: () => mockQueryBuilder,
    is: () => mockQueryBuilder,
    in: () => mockQueryBuilder,
    contains: () => mockQueryBuilder,
    order: () => mockQueryBuilder,
    limit: () => mockQueryBuilder,
    range: () => mockQueryBuilder,
    single: () => Promise.resolve({ data: null, error: null }),
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
    then: (resolve: any) => resolve(mockResponse),
  };

  const mockClient = {
    from: () => mockQueryBuilder,
    rpc: () => Promise.resolve(mockResponse),
    channel: () => ({
      on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
      subscribe: () => ({ unsubscribe: () => {} }),
    }),
    removeChannel: () => {},
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      signOut: () => Promise.resolve({ error: null }),
    },
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: null, error: null }),
        download: () => Promise.resolve({ data: null, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
      }),
    },
  };

  return mockClient as unknown as SupabaseClient;
}

/**
 * Check if Supabase is properly configured
 */
export function isSupabaseConfigured(): boolean {
  return !isBuildTime();
}

// Legacy export for compatibility - creates client lazily
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    const client = getSupabase();
    const value = (client as any)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});
