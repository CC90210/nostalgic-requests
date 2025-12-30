"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

interface DJProfile {
  id: string;
  user_id: string;
  email: string;
  dj_name: string;
  full_name: string | null;
  phone: string | null;
  bio: string | null;
  profile_image_url: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: DJProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, djName: string, phone: string, fullName?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<DJProfile | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

let supabaseInstance: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (supabaseInstance) return supabaseInstance;
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    throw new Error("Missing Supabase environment variables");
  }
  
  supabaseInstance = createClient(url, key);
  return supabaseInstance;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<DJProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Self-healing: If profile missing, create it via API
  const ensureProfile = useCallback(async (authUser: User): Promise<DJProfile | null> => {
    const supabase = getSupabaseClient();
    
    console.log("[Auth] Checking profile for:", authUser.email);
    
    // Try to fetch existing profile
    const { data: existingProfile, error: fetchError } = await supabase
      .from("dj_profiles")
      .select("*")
      .eq("user_id", authUser.id)
      .maybeSingle();

    if (existingProfile) {
      console.log("[Auth] Profile found:", existingProfile.dj_name);
      setProfile(existingProfile);
      return existingProfile;
    }

    // SELF-HEALING: Profile is missing, create it now!
    console.warn("[Auth] Profile MISSING! Triggering self-heal...");
    
    try {
      const response = await fetch("/api/auth/create-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: authUser.id,
          email: authUser.email,
          dj_name: authUser.user_metadata?.dj_name || authUser.email?.split("@")[0] || "DJ",
          phone: authUser.user_metadata?.phone || null,
        }),
      });

      const result = await response.json();
      
      if (response.ok && result.profile) {
        console.log("[Auth] Self-heal SUCCESS:", result.profile.dj_name);
        setProfile(result.profile);
        return result.profile;
      } else {
        console.error("[Auth] Self-heal FAILED:", result.error);
        return null;
      }
    } catch (err) {
      console.error("[Auth] Self-heal exception:", err);
      return null;
    }
  }, []);

  useEffect(() => {
    const supabase = getSupabaseClient();
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log("[Auth] Initializing...");
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (currentSession?.user) {
          console.log("[Auth] Session found:", currentSession.user.email);
          setSession(currentSession);
          setUser(currentSession.user);
          await ensureProfile(currentSession.user);
        } else {
          console.log("[Auth] No session");
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        console.error("[Auth] Init error:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log("[Auth] Event:", event);
        
        if (!mounted) return;

        if (event === "SIGNED_OUT") {
          setSession(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        if (newSession?.user) {
          setSession(newSession);
          setUser(newSession.user);
          await ensureProfile(newSession.user);
        }
        
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [ensureProfile]);

  const signUp = async (email: string, password: string, djName: string, phone: string, fullName?: string) => {
    const supabase = getSupabaseClient();
    
    console.log("[Auth] Signup for:", email);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { dj_name: djName, phone: phone }
      }
    });

    if (error) {
      console.error("[Auth] Signup error:", error);
      return { error };
    }

    if (!data.user) {
      return { error: { message: "Failed to create user" } };
    }

    // Create profile via API immediately
    try {
      const response = await fetch("/api/auth/create-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: data.user.id,
          email,
          dj_name: djName,
          full_name: fullName || null,
          phone: phone || null,
        }),
      });

      const result = await response.json();
      
      if (response.ok && result.profile) {
        console.log("[Auth] Profile created:", result.profile.dj_name);
        setProfile(result.profile);
      } else {
        console.error("[Auth] Profile API error:", result);
      }
    } catch (err) {
      console.error("[Auth] Profile exception:", err);
    }

    if (data.session) {
      setSession(data.session);
      setUser(data.user);
    }

    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    const supabase = getSupabaseClient();
    
    console.log("[Auth] Sign in:", email);
    
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      return { error };
    }

    if (data.user) {
      setSession(data.session);
      setUser(data.user);
      await ensureProfile(data.user);
    }
    
    return { error: null };
  };

  const signOut = async () => {
    const supabase = getSupabaseClient();
    setUser(null);
    setSession(null);
    setProfile(null);
    await supabase.auth.signOut();
  };

  const refreshProfile = async (): Promise<DJProfile | null> => {
    if (user) {
      return await ensureProfile(user);
    }
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
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

