import { useCallback, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import type { KeywordDef, KeywordType, DayRecord } from "../types";
import { STORAGE_KEYS, DEFAULT_KEYWORDS } from "../constants/defaults";

function safeParseKeywords(raw: string | null): KeywordDef[] {
  if (!raw) return DEFAULT_KEYWORDS;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_KEYWORDS;

    const normalized = parsed
      .filter((item) => item && typeof item === "object")
      .map((item) => ({
        id: String(item.id ?? "").trim(),
        name: String(item.name ?? "").trim(),
        type: String(item.type ?? "") as KeywordType,
      }))
      .filter(
        (item) =>
          item.id.length > 0 &&
          item.name.length > 0 &&
          ["scale", "check", "event", "tag"].includes(item.type)
      );

    return normalized;
  } catch {
    return DEFAULT_KEYWORDS;
  }
}

function groupByType(keywords: KeywordDef[]): Record<KeywordType, KeywordDef[]> {
  return {
    scale: keywords.filter((k) => k.type === "scale"),
    check: keywords.filter((k) => k.type === "check"),
    event: keywords.filter((k) => k.type === "event"),
    tag: keywords.filter((k) => k.type === "tag"),
  };
}

function generateKeywordId(name: string): string {
  const idBase = name
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_가-힣]/g, "")
    .slice(0, 24);
  return `${idBase || "keyword"}_${Date.now().toString(36)}`;
}

export function useKeywords() {
  const [keywords, setKeywords] = useLocalStorage<KeywordDef[]>(
    STORAGE_KEYS.keywords,
    DEFAULT_KEYWORDS,
    safeParseKeywords
  );

  const grouped = useMemo(() => groupByType(keywords), [keywords]);
  const scaleKeywords = useMemo(() => keywords.filter((k) => k.type === "scale"), [keywords]);

  const addKeyword = useCallback(
    (name: string, type: KeywordType) => {
      const trimmed = name.trim();
      if (!trimmed) return false;

      const id = generateKeywordId(trimmed);
      setKeywords((prev) => [...prev, { id, name: trimmed, type }]);
      return true;
    },
    [setKeywords]
  );

  const updateKeyword = useCallback(
    (id: string, name: string, type?: KeywordType) => {
      const trimmed = name.trim();
      if (!trimmed) return false;

      setKeywords((prev) => prev.map((k) => {
        if (k.id !== id) return k;
        return { ...k, name: trimmed, type: type ?? k.type };
      }));
      return true;
    },
    [setKeywords]
  );

  const deleteKeyword = useCallback(
    (id: string, updateRecords: (fn: (prev: Record<string, DayRecord>) => Record<string, DayRecord>) => void) => {
      setKeywords((prev) => prev.filter((k) => k.id !== id));
      updateRecords((prev) => {
        const next: Record<string, DayRecord> = {};
        for (const [key, rec] of Object.entries(prev)) {
          const copied = { ...rec.values };
          delete copied[id];
          next[key] = { ...rec, values: copied };
        }
        return next;
      });
    },
    [setKeywords]
  );

  const moveKeyword = useCallback(
    (id: string, direction: "up" | "down") => {
      setKeywords((prev) => {
        const index = prev.findIndex((k) => k.id === id);
        if (index === -1) return prev;

        const newIndex = direction === "up" ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= prev.length) return prev;

        const newKeywords = [...prev];
        [newKeywords[index], newKeywords[newIndex]] = [newKeywords[newIndex], newKeywords[index]];
        return newKeywords;
      });
    },
    [setKeywords]
  );

  const resetToDefaults = useCallback(() => {
    setKeywords(DEFAULT_KEYWORDS);
  }, [setKeywords]);

  return {
    keywords,
    grouped,
    scaleKeywords,
    addKeyword,
    updateKeyword,
    deleteKeyword,
    moveKeyword,
    resetToDefaults,
    setKeywords,
  };
}
