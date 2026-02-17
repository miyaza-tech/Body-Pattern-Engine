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
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    configured: isSupabaseConfigured(),
  });

  useEffect(() => {
    if (!state.configured || !supabase) {
      setState((prev) => ({ ...prev, loading: false }));
      return;
    }

    // 현재 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState((prev) => ({
        ...prev,
        session,
        user: session?.user ?? null,
        loading: false,
      }));
    });

    // 인증 상태 변화 감지
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

  // 이메일로 매직 링크 로그인
  const signInWithEmail = useCallback(async (email: string) => {
    if (!state.configured || !supabase) return { error: new Error("Supabase 미설정") };

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    return { error };
  }, [state.configured]);

  // 이메일 + 비밀번호 회원가입
  const signUp = useCallback(async (email: string, password: string) => {
    if (!state.configured || !supabase) return { error: new Error("Supabase 미설정") };

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    return { error };
  }, [state.configured]);

  // 이메일 + 비밀번호 로그인
  const signIn = useCallback(async (email: string, password: string) => {
    if (!state.configured || !supabase) return { error: new Error("Supabase 미설정") };

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error };
  }, [state.configured]);

  // 로그아웃
  const signOut = useCallback(async () => {
    if (!state.configured || !supabase) return;
    await supabase.auth.signOut();
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
