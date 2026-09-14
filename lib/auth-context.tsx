"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";

interface DJProfile {
  id: string;
  user_id: string;
  email: string;
  dj_name: string;
  full_name: string | null;
  phone: string | null;
  bio: string | null;
  profile_image_url: string | null;
  // The payout pair. Two dashboard screens already gated their UI on
  // stripe_onboarding_complete while this type claimed the field did not exist;
  // only next.config's ignoreBuildErrors kept that from failing the build.
  // It is an INTEGER column (1/0), not a boolean — read it for truthiness, and
  // never compare it to `true`.
  stripe_account_id: string | null;
  stripe_onboarding_complete: number | boolean | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: DJProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, djName: string, phone: string, fullName?: string) => Promise<{ error: any; profile?: DJProfile }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<DJProfile | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

let supabaseInstance: any | null = null;

function getSupabaseClient() {
  if (supabaseInstance) return supabaseInstance;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Missing Supabase environment variables");
  
  // USE BROWSER CLIENT (SSR COMPATIBLE)
  supabaseInstance = createBrowserClient(url, key);
  return supabaseInstance;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<DJProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch profile via API (bypasses RLS logic if needed, but we prefer strict)
  const fetchProfile = useCallback(async (userId: string): Promise<DJProfile | null> => {
    // console.log("[Auth] Fetching profile via API for:", userId);
    try {
      const response = await fetch("/api/auth/get-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });
      const result = await response.json();
      if (result.profile) {
        setProfile(result.profile);
        return result.profile;
      }
      setProfile(null);
      return null;
    } catch (error) {
      console.error("[Auth] Profile fetch error:", error);
      setProfile(null);
      return null;
    }
  }, []);

  useEffect(() => {
    const supabase = getSupabaseClient();
    let mounted = true;

    // Turso auth mode: identity from our cookie-verified endpoint; the
    // Supabase session machinery below never runs.
    if (process.env.NEXT_PUBLIC_EMPIRE_AUTH_BACKEND === "turso") {
      (async () => {
        try {
          const r = await fetch("/api/auth/turso-me");
          const b = (await r.json()) as { user: { id: string; email: string } | null };
          if (!mounted) return;
          if (b.user) {
            setUser(b.user as any);
            await fetchProfile(b.user.id);
          }
        } catch (error) {
          console.error("[Auth] Turso init error:", error);
        } finally {
          if (mounted) setLoading(false);
        }
      })();
      return () => { mounted = false; };
    }

    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (!mounted) return;
        
        if (currentSession?.user) {
          setSession(currentSession);
          setUser(currentSession.user);
          await fetchProfile(currentSession.user.id);
        }
      } catch (error) {
        console.error("[Auth] Init error:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: any, newSession: any) => {
        if (!mounted) return;

        if (event === "SIGNED_OUT") {
          setSession(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
          // router refresh handled by components
          return;
        }

        if (newSession?.user) {
          setSession(newSession);
          setUser(newSession.user);
          await fetchProfile(newSession.user.id);
        }
        setLoading(false);
      }
    );

    return () => { mounted = false; subscription.unsubscribe(); };
  }, [fetchProfile]);

  const signUp = async (email: string, password: string, djName: string, phone: string, fullName?: string): Promise<{ error: any; profile?: DJProfile }> => {
    // Turso auth mode: the auth user, its password hash and the dj_profiles row
    // are created together, server-side, by /api/auth/turso-signup, which also
    // sets the session cookie. No Supabase auth user is involved, so nothing is
    // stranded. (This branch replaces the maintenance gate that shipped with the
    // Turso cutover; while it was live the build folded signUp down to an
    // unconditional error and no account could be created at all.)
    if (process.env.NEXT_PUBLIC_EMPIRE_AUTH_BACKEND === "turso") {
      let r: Response;
      try {
        r = await fetch("/api/auth/turso-signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, djName, phone, fullName: fullName || null }),
        });
      } catch {
        return { error: { message: "Network error" } };
      }
      const b = (await r.json().catch(() => ({}))) as
        { user?: { id: string; email: string }; profile?: DJProfile; error?: string };
      if (!r.ok || !b.user) {
        return { error: { message: b.error || "Account creation failed" } };
      }
      setUser(b.user as any);
      setProfile(b.profile ?? null);
      return { error: null, profile: b.profile };
    }
    // SUPABASE-AUTH PATH — not reachable in production, which runs
    // NEXT_PUBLIC_EMPIRE_AUTH_BACKEND=turso. That is confirmed in the live
    // client bundle, where the comparison above is constant-folded away.
    //
    // KNOWN HAZARD if that flag is ever flipped back, raised by the Codex audit
    // of 2026-09-13 and deliberately left unfixed rather than repaired blind on
    // a dead path: with Supabase email confirmation enabled, signUp() returns a
    // user but NO session. /api/auth/create-profile authenticates through
    // requireUser(), so it answers 401, this branch reports "Failed to save
    // profile" and signs the user out — while the auth account already exists.
    // The address is then taken and its owner has no profile. Before re-enabling
    // this path, profile creation must be deferred until after confirmation.
    const supabase = getSupabaseClient();

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email, 
      password,
      options: { data: { dj_name: djName, phone: phone, full_name: fullName || null } }
    });
    
    if (authError) return { error: authError };
    if (!authData.user) return { error: { message: "Failed to create user" } };

    try {
      const response = await fetch("/api/auth/create-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: authData.user.id, email, dj_name: djName, phone, full_name: fullName || null }),
      });
      
      const result = await response.json();
      
      if (response.ok && result.profile) {
        setProfile(result.profile);
        setUser(authData.user);
        if (authData.session) setSession(authData.session);
        return { error: null, profile: result.profile };
      }
      
      await supabase.auth.signOut();
      return { error: { message: result.error || "Failed to save profile" } };
    } catch (err: any) {
      await supabase.auth.signOut();
      return { error: { message: "Network error" } };
    }
  };

  const signIn = async (email: string, password: string) => {
    // Turso auth mode: same credentials, verified server-side against the
    // migrated hash store; session is our HttpOnly cookie.
    if (process.env.NEXT_PUBLIC_EMPIRE_AUTH_BACKEND === "turso") {
      const r = await fetch("/api/auth/turso-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!r.ok) {
        return { error: { message: r.status === 429
          ? "Too many attempts — wait a few minutes."
          : "Invalid email or password." } };
      }
      const b = (await r.json()) as { user: { id: string; email: string } };
      setUser(b.user as any);
      await fetchProfile(b.user.id);
      return { error: null };
    }
    const supabase = getSupabaseClient();

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) return { error };

    if (data.user) {
      setSession(data.session);
      setUser(data.user);
      await fetchProfile(data.user.id);
    }

    return { error: null };
  };

  const signOut = async () => {
    if (process.env.NEXT_PUBLIC_EMPIRE_AUTH_BACKEND === "turso") {
      await fetch("/api/auth/turso-me", { method: "DELETE" }).catch(() => null);
      setUser(null);
      setSession(null);
      setProfile(null);
      return;
    }
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    // Hard refresh handled by component if needed
  };

  const refreshProfile = async (): Promise<DJProfile | null> => {
    if (user) return await fetchProfile(user.id);
    return null;
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signUp, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
