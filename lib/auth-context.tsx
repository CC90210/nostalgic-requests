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
  signUp: (email: string, password: string, djName: string, phone: string, fullName?: string) => Promise<{ error: any; profile?: DJProfile }>;
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

  const fetchProfile = useCallback(async (userId: string): Promise<DJProfile | null> => {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from("dj_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (data) {
      setProfile(data);
      return data;
    }
    
    return null;
  }, []);

  useEffect(() => {
    const supabase = getSupabaseClient();
    let mounted = true;

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
      async (event, newSession) => {
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
          await fetchProfile(newSession.user.id);
        }
        
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // ATOMIC SIGNUP: Profile MUST be created or we rollback
  const signUp = async (email: string, password: string, djName: string, phone: string, fullName?: string): Promise<{ error: any; profile?: DJProfile }> => {
    const supabase = getSupabaseClient();
    
    console.log("[Auth] ATOMIC Signup starting for:", email);
    
    // Step 1: Create Auth User
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      console.error("[Auth] Auth signup failed:", authError);
      return { error: authError };
    }

    if (!authData.user) {
      return { error: { message: "Failed to create user account" } };
    }

    console.log("[Auth] Auth user created:", authData.user.id);

    // Step 2: FORCE Profile Creation - MUST succeed
    try {
      const response = await fetch("/api/auth/create-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: authData.user.id,
          email: email,
          dj_name: djName,
          phone: phone,
          full_name: fullName || null,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.profile) {
        // ROLLBACK: Profile failed, sign out the user
        console.error("[Auth] Profile creation FAILED - ROLLING BACK");
        await supabase.auth.signOut();
        return { error: { message: result.error || "Failed to save your profile. Please try again." } };
      }

      console.log("[Auth] Profile created successfully:", result.profile.dj_name);

      // Step 3: Set state BEFORE returning success
      setProfile(result.profile);
      setUser(authData.user);
      if (authData.session) {
        setSession(authData.session);
      }

      return { error: null, profile: result.profile };

    } catch (err: any) {
      // Network error or exception - rollback
      console.error("[Auth] Profile API exception - ROLLING BACK:", err);
      await supabase.auth.signOut();
      return { error: { message: "Network error while creating profile. Please try again." } };
    }
  };

  const signIn = async (email: string, password: string) => {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      return { error };
    }

    if (data.user) {
      setSession(data.session);
      setUser(data.user);
      await fetchProfile(data.user.id);
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
      return await fetchProfile(user.id);
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

