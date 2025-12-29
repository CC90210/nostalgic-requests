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
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Singleton Supabase client
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

  // Fetch profile from database
  const fetchProfile = useCallback(async (userId: string): Promise<DJProfile | null> => {
    try {
      const supabase = getSupabaseClient();
      console.log("[Auth] Fetching profile for user:", userId);
      
      const { data, error } = await supabase
        .from("dj_profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) {
        console.error("[Auth] Profile fetch error:", error);
        return null;
      }

      if (data) {
        console.log("[Auth] Profile loaded:", data.dj_name);
        setProfile(data);
        return data;
      }
      
      return null;
    } catch (error) {
      console.error("[Auth] Profile fetch exception:", error);
      return null;
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    const supabase = getSupabaseClient();
    let mounted = true;

    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (currentSession?.user) {
          console.log("[Auth] Initial session found for:", currentSession.user.email);
          setSession(currentSession);
          setUser(currentSession.user);
          await fetchProfile(currentSession.user.id);
        } else {
          console.log("[Auth] No initial session");
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

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log("[Auth] State change:", event);
        
        if (!mounted) return;

        if (newSession?.user) {
          setSession(newSession);
          setUser(newSession.user);
          
          // Always fetch profile on auth state change
          await fetchProfile(newSession.user.id);
        } else {
          // Clear everything on sign out
          setSession(null);
          setUser(null);
          setProfile(null);
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
    
    console.log("[Auth] Starting signup for:", email);
    
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

    console.log("[Auth] User created, creating profile...");

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
        console.log("[Auth] Profile created:", result.profile.dj_name);
        setProfile(result.profile);
      } else {
        console.error("[Auth] Profile creation failed:", result);
      }
    } catch (profileError) {
      console.error("[Auth] Profile creation exception:", profileError);
    }

    // Set session immediately if available
    if (data.session) {
      setSession(data.session);
      setUser(data.user);
    }

    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    const supabase = getSupabaseClient();
    
    console.log("[Auth] Signing in:", email);
    
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
      await fetchProfile(data.user.id);
    }
    
    return { error: null };
  };

  const signOut = async () => {
    const supabase = getSupabaseClient();
    
    console.log("[Auth] Signing out...");
    
    // Clear state FIRST
    setUser(null);
    setSession(null);
    setProfile(null);
    
    // Then sign out from Supabase
    await supabase.auth.signOut();
    
    console.log("[Auth] Sign out complete");
  };

  const refreshProfile = async () => {
    if (user) {
      console.log("[Auth] Refreshing profile...");
      await fetchProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      profile, 
      loading, 
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

