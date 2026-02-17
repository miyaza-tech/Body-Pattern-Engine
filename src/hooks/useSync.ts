import { useState, useCallback } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import type { KeywordDef, DayRecord, PeriodOption } from "../types";
import { STORAGE_KEYS } from "../constants/defaults";

const LOCAL_SYNC_AT_KEY = "bpe_local_sync_updated_at";

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

  const getLocalData = useCallback((): SyncData => {
    const keywords = JSON.parse(localStorage.getItem(STORAGE_KEYS.keywords) || "[]");
    const records = JSON.parse(localStorage.getItem(STORAGE_KEYS.records) || "{}");
    const periods = JSON.parse(localStorage.getItem(STORAGE_KEYS.periods) || "[]");
    const updatedAt = localStorage.getItem(LOCAL_SYNC_AT_KEY) || new Date(0).toISOString();

    return {
      keywords,
      records,
      periods,
      updated_at: updatedAt,
    };
  }, []);

  const setLocalData = useCallback((data: SyncData) => {
    console.log("setLocalData called:", { 
      keywordsCount: data.keywords?.length ?? 0,
      periodsCount: data.periods?.length ?? 0,
      recordsCount: Object.keys(data.records ?? {}).length,
    });
    localStorage.setItem(STORAGE_KEYS.keywords, JSON.stringify(data.keywords ?? []));
    localStorage.setItem(STORAGE_KEYS.records, JSON.stringify(data.records ?? {}));
    localStorage.setItem(STORAGE_KEYS.periods, JSON.stringify(data.periods ?? []));
    localStorage.setItem(LOCAL_SYNC_AT_KEY, data.updated_at || new Date().toISOString());
    console.log("localStorage updated");
  }, []);

  const upload = useCallback(async () => {
    if (!userId || !isSupabaseConfigured() || !supabase) {
      setState((prev) => ({ ...prev, error: "로그인이 필요합니다." }));
      return false;
    }

    setState((prev) => ({ ...prev, syncing: true, error: null }));

    try {
      const now = new Date().toISOString();
      const localData: SyncData = {
        ...getLocalData(),
        updated_at: now,
      };

      const { error } = await supabase
        .from("user_data")
        .upsert(
          {
            user_id: userId,
            data: localData,
            updated_at: localData.updated_at,
          },
          { onConflict: "user_id" }
        );

      if (error) throw error;

      localStorage.setItem(LOCAL_SYNC_AT_KEY, now);

      setState({
        syncing: false,
        lastSync: new Date(),
        error: null,
      });
      return true;
    } catch (err) {
      const errMsg = err instanceof Error 
        ? err.message 
        : typeof err === "object" && err !== null && "message" in err
          ? String((err as { message: unknown }).message)
          : "업로드 실패";
      console.error("Upload error:", err);
      setState({
        syncing: false,
        lastSync: null,
        error: errMsg,
      });
      return false;
    }
  }, [userId, getLocalData]);

  const download = useCallback(async () => {
    if (!userId || !isSupabaseConfigured() || !supabase) {
      setState((prev) => ({ ...prev, error: "로그인이 필요합니다." }));
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
        const cloudData = data.data as Omit<SyncData, "updated_at">;
        setLocalData({
          ...cloudData,
          updated_at: data.updated_at,
        });
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

  const sync = useCallback(async () => {
    if (!userId || !isSupabaseConfigured() || !supabase) {
      setState((prev) => ({ ...prev, error: "로그인이 필요합니다." }));
      return false;
    }

    setState((prev) => ({ ...prev, syncing: true, error: null }));

    try {
      const { data: cloudData, error: fetchError } = await supabase
        .from("user_data")
        .select("data, updated_at")
        .eq("user_id", userId)
        .single();

      console.log("Sync - cloudData:", cloudData);
      console.log("Sync - fetchError:", fetchError);

      const localData = getLocalData();
      const localUpdatedAt = new Date(localData.updated_at);
      console.log("Sync - localUpdatedAt:", localUpdatedAt);

      if (fetchError && fetchError.code !== "PGRST116") {
        throw fetchError;
      }

      if (!cloudData) {
        console.log("Sync - no cloud data, uploading");
        const uploaded = await upload();
        if (!uploaded) return false;
      } else {
        const cloudUpdatedAt = new Date(cloudData.updated_at);
        console.log("Sync - cloudUpdatedAt:", cloudUpdatedAt);
        console.log("Sync - cloud > local?", cloudUpdatedAt > localUpdatedAt);
        
        // 로컬에 periods가 없으면 새 디바이스로 간주하여 무조건 다운로드
        const localIsEmpty = !localData.periods || localData.periods.length === 0;
        console.log("Sync - localIsEmpty:", localIsEmpty);
        
        if (localIsEmpty || cloudUpdatedAt > localUpdatedAt) {
          console.log("Sync - downloading from cloud");
          const data = cloudData.data as Omit<SyncData, "updated_at">;
          console.log("Sync - cloud data content:", data);
          setLocalData({
            ...data,
            updated_at: cloudData.updated_at,
          });
        } else {
          console.log("Sync - local is newer, uploading");
          const uploaded = await upload();
          if (!uploaded) return false;
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
