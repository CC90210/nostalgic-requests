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
  profileLoading: boolean;
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
  const [profileLoading, setProfileLoading] = useState(false);

  // Fetch profile - returns the profile or null
  const fetchProfile = useCallback(async (userId: string): Promise<DJProfile | null> => {
    setProfileLoading(true);
    
    try {
      const supabase = getSupabaseClient();
      console.log("[Auth] Fetching profile for user_id:", userId);
      
      const { data, error } = await supabase
        .from("dj_profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("[Auth] Profile fetch error:", error.message);
        setProfile(null);
        return null;
      }

      if (data) {
        console.log("[Auth] Profile found:", data.dj_name, "| ID:", data.id);
        setProfile(data);
        return data;
      } else {
        console.warn("[Auth] No profile found for user_id:", userId);
        setProfile(null);
        return null;
      }
    } catch (error) {
      console.error("[Auth] Profile fetch exception:", error);
      setProfile(null);
      return null;
    } finally {
      setProfileLoading(false);
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    const supabase = getSupabaseClient();
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log("[Auth] Initializing...");
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("[Auth] Session error:", error);
        }
        
        if (!mounted) return;
        
        if (currentSession?.user) {
          console.log("[Auth] Session found for:", currentSession.user.email);
          setSession(currentSession);
          setUser(currentSession.user);
          await fetchProfile(currentSession.user.id);
        } else {
          console.log("[Auth] No session found");
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        console.error("[Auth] Init error:", error);
      } finally {
        if (mounted) {
          setLoading(false);
          console.log("[Auth] Init complete, loading = false");
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log("[Auth] Event:", event);
        
        if (!mounted) return;

        if (event === "SIGNED_OUT") {
          console.log("[Auth] User signed out, clearing state");
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

  const signUp = async (email: string, password: string, djName: string, phone: string, fullName?: string) => {
    const supabase = getSupabaseClient();
    
    console.log("[Auth] Signup starting for:", email);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error("[Auth] Signup error:", error);
      return { error };
    }

    if (!data.user) {
      return { error: { message: "Failed to create user" } };
    }

    console.log("[Auth] User created:", data.user.id);

    // Create DJ profile via API
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
        console.log("[Auth] Profile created via API:", result.profile.dj_name);
        setProfile(result.profile);
      } else {
        console.error("[Auth] Profile API error:", result);
      }
    } catch (profileError) {
      console.error("[Auth] Profile creation exception:", profileError);
    }

    if (data.session) {
      setSession(data.session);
      setUser(data.user);
    }

    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    const supabase = getSupabaseClient();
    
    console.log("[Auth] Sign in starting for:", email);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error("[Auth] Sign in error:", error);
      return { error };
    }

    if (data.user) {
      console.log("[Auth] Sign in successful, fetching profile...");
      setSession(data.session);
      setUser(data.user);
      await fetchProfile(data.user.id);
    }
    
    return { error: null };
  };

  const signOut = async () => {
    const supabase = getSupabaseClient();
    
    console.log("[Auth] Signing out...");
    
    // Clear state first
    setUser(null);
    setSession(null);
    setProfile(null);
    
    await supabase.auth.signOut();
    
    console.log("[Auth] Sign out complete");
  };

  const refreshProfile = async (): Promise<DJProfile | null> => {
    if (user) {
      console.log("[Auth] Refreshing profile for:", user.id);
      return await fetchProfile(user.id);
    }
    return null;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      profile, 
      loading,
      profileLoading,
      signUp, 
      signIn, 
      signOut, 
      refreshProfile 
    }}>
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

