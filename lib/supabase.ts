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

  // NOTE: the Turso data-plane switch does NOT live here. This file is
  // imported by client components (auth-context, browser proxy), so ANY
  // reference to @libsql/client from here — even a lazy require — gets traced
  // into the browser bundle and breaks the build ("Can't resolve 'fs'", seen
  // on the first Turso deploy). Server code that needs the switched admin
  // client imports lib/supabase-admin.ts instead.
  supabaseAdminInstance = createClient(supabaseUrl, supabaseServiceKey);
  return supabaseAdminInstance;
}

/**
 * Stand-in used when Supabase env vars are absent.
 *
 * This used to resolve every query to `{data: null, error: null, status: 200}`
 * — a successful-looking empty result. With Supabase cancelled and its vars
 * removed, that turned the whole app into a silent liar: the live dashboard
 * showed "$0.00 revenue, no requests", the leads table read "No leads yet",
 * and saving prices reported success while writing nothing. Every one of those
 * is indistinguishable from a genuinely empty account.
 *
 * It now fails loudly instead. Nothing imports getSupabase() any more (the app
 * routes through lib/supabase-admin.ts and lib/require-user.ts, which honour
 * EMPIRE_DATA_BACKEND); this exists so that if something ever does again, it
 * announces itself rather than quietly serving nothing.
 */
function createMockClient(): SupabaseClient {
  const refuse = (): never => {
    throw new Error(
      'Supabase is not configured, and this call site has not been ported to ' +
      'the Turso data plane. Use getAdminData()/adminData from ' +
      'lib/supabase-admin.ts (server) or a scoped /api route (browser).',
    );
  };
  const mockResponse = {
    get data(): never { return refuse(); },
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
