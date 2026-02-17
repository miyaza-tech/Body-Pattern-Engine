import { useState, useEffect, useCallback } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import type { User, Session } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  configured: boolean;
}

export function useAuth() {
  const configured = isSupabaseConfigured();
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: configured,
    configured,
  });

  useEffect(() => {
    if (!state.configured || !supabase) {
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setState((prev) => ({
        ...prev,
        session,
        user: session?.user ?? null,
        loading: false,
      }));
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setState((prev) => ({
        ...prev,
        session,
        user: session?.user ?? null,
        loading: false,
      }));
    });

    return () => subscription.unsubscribe();
  }, [state.configured]);

  const signInWithEmail = useCallback(
    async (email: string) => {
      if (!state.configured || !supabase) {
        return { error: new Error("Supabase is not configured.") };
      }

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      return { error };
    },
    [state.configured]
  );

  const signUp = useCallback(
    async (email: string, password: string) => {
      if (!state.configured || !supabase) {
        return { error: new Error("Supabase is not configured.") };
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      return { error };
    },
    [state.configured]
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!state.configured || !supabase) {
        return { error: new Error("Supabase is not configured.") };
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      return { error };
    },
    [state.configured]
  );

  const signOut = useCallback(async () => {
    if (!state.configured || !supabase) return;

    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  }, [state.configured]);

  return {
    user: state.user,
    session: state.session,
    loading: state.loading,
    configured: state.configured,
    isLoggedIn: !!state.user,
    signInWithEmail,
    signUp,
    signIn,
    signOut,
  };
}
