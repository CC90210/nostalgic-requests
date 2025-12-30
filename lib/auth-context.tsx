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
  if (!url || !key) throw new Error("Missing Supabase environment variables");
  supabaseInstance = createClient(url, key);
  return supabaseInstance;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<DJProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch profile via API (bypasses RLS)
  const fetchProfile = useCallback(async (userId: string): Promise<DJProfile | null> => {
    console.log("[Auth] Fetching profile via API for:", userId);
    
    try {
      const response = await fetch("/api/auth/get-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });

      const result = await response.json();

      if (result.profile) {
        console.log("[Auth] Profile loaded:", result.profile.dj_name);
        setProfile(result.profile);
        return result.profile;
      }
      
      console.log("[Auth] No profile found");
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

    return () => { mounted = false; subscription.unsubscribe(); };
  }, [fetchProfile]);

  const signUp = async (email: string, password: string, djName: string, phone: string, fullName?: string): Promise<{ error: any; profile?: DJProfile }> => {
    const supabase = getSupabaseClient();
    
    console.log("[Auth] Signup:", email, "DJ:", djName);
    
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
    const supabase = getSupabaseClient();
    
    console.log("[Auth] Sign in:", email);
    
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
    const supabase = getSupabaseClient();
    setUser(null);
    setSession(null);
    setProfile(null);
    await supabase.auth.signOut();
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

