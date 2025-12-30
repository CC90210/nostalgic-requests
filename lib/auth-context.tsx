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

  // Fetch profile - just fetch, no auto-create
  const fetchProfile = useCallback(async (authUser: User): Promise<DJProfile | null> => {
    const supabase = getSupabaseClient();
    
    console.log("[Auth] Fetching profile for:", authUser.email);
    
    const { data: existingProfile, error } = await supabase
      .from("dj_profiles")
      .select("*")
      .eq("user_id", authUser.id)
      .maybeSingle();

    if (existingProfile) {
      console.log("[Auth] Profile found:", existingProfile.dj_name);
      setProfile(existingProfile);
      return existingProfile;
    }

    // Profile not found - try to auto-heal using user_metadata
    console.warn("[Auth] Profile NOT FOUND - attempting auto-heal...");
    
    const djName = authUser.user_metadata?.dj_name || authUser.email?.split("@")[0] || "DJ";
    const phone = authUser.user_metadata?.phone || null;
    const fullName = authUser.user_metadata?.full_name || null;
    
    try {
      const response = await fetch("/api/auth/create-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: authUser.id,
          email: authUser.email,
          dj_name: djName,
          phone: phone,
          full_name: fullName,
        }),
      });

      const result = await response.json();
      
      if (response.ok && result.profile) {
        console.log("[Auth] Auto-heal SUCCESS:", result.profile.dj_name);
        setProfile(result.profile);
        return result.profile;
      }
    } catch (err) {
      console.error("[Auth] Auto-heal failed:", err);
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
          await fetchProfile(currentSession.user);
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
          await fetchProfile(newSession.user);
        }
        setLoading(false);
      }
    );

    return () => { mounted = false; subscription.unsubscribe(); };
  }, [fetchProfile]);

  // SIGNUP: Store DJ name and phone in user_metadata + create profile
  const signUp = async (email: string, password: string, djName: string, phone: string, fullName?: string): Promise<{ error: any; profile?: DJProfile }> => {
    const supabase = getSupabaseClient();
    
    console.log("[Auth] Signup for:", email, "DJ:", djName, "Phone:", phone);
    
    // Store DJ info in user_metadata so auto-heal can use it later
    const { data: authData, error: authError } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: {
          dj_name: djName,
          phone: phone,
          full_name: fullName || null,
        }
      }
    });
    
    if (authError) {
      console.error("[Auth] Signup error:", authError);
      return { error: authError };
    }
    
    if (!authData.user) {
      return { error: { message: "Failed to create user" } };
    }

    console.log("[Auth] Auth user created, now creating profile...");

    // Create profile in database
    try {
      const response = await fetch("/api/auth/create-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          user_id: authData.user.id, 
          email, 
          dj_name: djName, 
          phone: phone, 
          full_name: fullName || null 
        }),
      });
      
      const result = await response.json();
      
      console.log("[Auth] Profile API response:", result);
      
      if (response.ok && result.profile) {
        console.log("[Auth] Profile created:", result.profile.dj_name, result.profile.phone);
        setProfile(result.profile);
        setUser(authData.user);
        if (authData.session) setSession(authData.session);
        return { error: null, profile: result.profile };
      }
      
      // Profile creation failed - rollback
      console.error("[Auth] Profile creation failed, rolling back...");
      await supabase.auth.signOut();
      return { error: { message: result.error || "Failed to save profile" } };
    } catch (err: any) {
      console.error("[Auth] Profile exception:", err);
      await supabase.auth.signOut();
      return { error: { message: "Network error while saving profile" } };
    }
  };

  // SIGNIN: Fetch existing profile
  const signIn = async (email: string, password: string) => {
    const supabase = getSupabaseClient();
    
    console.log("[Auth] Sign in for:", email);
    
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      console.error("[Auth] Sign in error:", error);
      return { error };
    }
    
    if (data.user) {
      console.log("[Auth] Sign in successful, fetching profile...");
      setSession(data.session);
      setUser(data.user);
      await fetchProfile(data.user);
    }
    
    return { error: null };
  };

  const signOut = async () => {
    const supabase = getSupabaseClient();
    console.log("[Auth] Signing out...");
    setUser(null);
    setSession(null);
    setProfile(null);
    await supabase.auth.signOut();
  };

  const refreshProfile = async (): Promise<DJProfile | null> => {
    if (user) return await fetchProfile(user);
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

