import { useState, useCallback } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import type { KeywordDef, DayRecord, PeriodOption } from "../types";
import { STORAGE_KEYS } from "../constants/defaults";

interface SyncData {
  keywords: KeywordDef[];
  records: Record<string, DayRecord>;
  periods: PeriodOption[];
  updated_at: string;
}

interface SyncState {
  syncing: boolean;
  lastSync: Date | null;
  error: string | null;
}

export function useSync(userId: string | null) {
  const [state, setState] = useState<SyncState>({
    syncing: false,
    lastSync: null,
    error: null,
  });

  // 로컬 데이터 가져오기
  const getLocalData = useCallback((): SyncData => {
    const keywords = JSON.parse(localStorage.getItem(STORAGE_KEYS.keywords) || "[]");
    const records = JSON.parse(localStorage.getItem(STORAGE_KEYS.records) || "{}");
    const periods = JSON.parse(localStorage.getItem(STORAGE_KEYS.periods) || "[]");

    return {
      keywords,
      records,
      periods,
      updated_at: new Date().toISOString(),
    };
  }, []);

  // 로컬에 데이터 저장
  const setLocalData = useCallback((data: SyncData) => {
    localStorage.setItem(STORAGE_KEYS.keywords, JSON.stringify(data.keywords));
    localStorage.setItem(STORAGE_KEYS.records, JSON.stringify(data.records));
    localStorage.setItem(STORAGE_KEYS.periods, JSON.stringify(data.periods));
  }, []);

  // 클라우드로 업로드
  const upload = useCallback(async () => {
    if (!userId || !isSupabaseConfigured() || !supabase) {
      setState((prev) => ({ ...prev, error: "로그인이 필요합니다" }));
      return false;
    }

    setState((prev) => ({ ...prev, syncing: true, error: null }));

    try {
      const localData = getLocalData();

      const { error } = await supabase
        .from("user_data")
        .upsert({
          user_id: userId,
          data: localData,
          updated_at: localData.updated_at,
        });

      if (error) throw error;

      setState({
        syncing: false,
        lastSync: new Date(),
        error: null,
      });
      return true;
    } catch (err) {
      setState({
        syncing: false,
        lastSync: null,
        error: err instanceof Error ? err.message : "업로드 실패",
      });
      return false;
    }
  }, [userId, getLocalData]);

  // 클라우드에서 다운로드
  const download = useCallback(async () => {
    if (!userId || !isSupabaseConfigured() || !supabase) {
      setState((prev) => ({ ...prev, error: "로그인이 필요합니다" }));
      return false;
    }

    setState((prev) => ({ ...prev, syncing: true, error: null }));

    try {
      const { data, error } = await supabase
        .from("user_data")
        .select("data, updated_at")
        .eq("user_id", userId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // 데이터 없음 - 새 사용자
          setState({
            syncing: false,
            lastSync: null,
            error: null,
          });
          return true;
        }
        throw error;
      }

      if (data?.data) {
        setLocalData(data.data as SyncData);
      }

      setState({
        syncing: false,
        lastSync: new Date(data.updated_at),
        error: null,
      });
      return true;
    } catch (err) {
      setState({
        syncing: false,
        lastSync: null,
        error: err instanceof Error ? err.message : "다운로드 실패",
      });
      return false;
    }
  }, [userId, setLocalData]);

  // 양방향 동기화 (최신 데이터 우선)
  const sync = useCallback(async () => {
    if (!userId || !isSupabaseConfigured() || !supabase) {
      setState((prev) => ({ ...prev, error: "로그인이 필요합니다" }));
      return false;
    }

    setState((prev) => ({ ...prev, syncing: true, error: null }));

    try {
      // 클라우드 데이터 확인
      const { data: cloudData, error: fetchError } = await supabase
        .from("user_data")
        .select("data, updated_at")
        .eq("user_id", userId)
        .single();

      const localData = getLocalData();
      const localUpdatedAt = new Date(localData.updated_at);

      if (fetchError && fetchError.code !== "PGRST116") {
        throw fetchError;
      }

      if (!cloudData) {
        // 클라우드에 데이터 없음 - 업로드
        await upload();
      } else {
        const cloudUpdatedAt = new Date(cloudData.updated_at);

        if (cloudUpdatedAt > localUpdatedAt) {
          // 클라우드가 최신 - 다운로드
          setLocalData(cloudData.data as SyncData);
        } else {
          // 로컬이 최신 또는 같음 - 업로드
          await upload();
        }
      }

      setState({
        syncing: false,
        lastSync: new Date(),
        error: null,
      });
      return true;
    } catch (err) {
      setState({
        syncing: false,
        lastSync: null,
        error: err instanceof Error ? err.message : "동기화 실패",
      });
      return false;
    }
  }, [userId, getLocalData, setLocalData, upload]);

  return {
    ...state,
    upload,
    download,
    sync,
    configured: isSupabaseConfigured(),
  };
}
