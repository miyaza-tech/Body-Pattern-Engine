import { useCallback, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import type { DayRecord, KeywordDef, PeriodOption } from "../types";
import { STORAGE_KEYS } from "../constants/defaults";

function safeParseRecords(raw: string | null): Record<string, DayRecord> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};

    const out: Record<string, DayRecord> = {};
    for (const [key, value] of Object.entries(parsed)) {
      const rec = value as Partial<DayRecord>;
      if (!rec || typeof rec !== "object") continue;
      if (typeof rec.periodId !== "string" || typeof rec.day !== "number") continue;

      out[key] = {
        periodId: rec.periodId,
        day: rec.day,
        memo: typeof rec.memo === "string" ? rec.memo : "",
        values: rec.values && typeof rec.values === "object" ? rec.values : {},
      };
    }
    return out;
  } catch {
    return {};
  }
}

export function makeRecordKey(periodId: string, day: number): string {
  return `${periodId}__${day}`;
}

export function useRecords(periods: PeriodOption[]) {
  const [records, setRecords] = useLocalStorage<Record<string, DayRecord>>(
    STORAGE_KEYS.records,
    {},
    safeParseRecords
  );

  const periodOrder = useCallback(
    (periodId: string): number => {
      const idx = periods.findIndex((p) => p.id === periodId);
      if (idx < 0) return 999999;
      const p = periods[idx];
      return p.year * 1000 + idx;
    },
    [periods]
  );

  const sortedRecords = useMemo(() => {
    return Object.values(records).sort((a, b) => {
      const pDiff = periodOrder(a.periodId) - periodOrder(b.periodId);
      if (pDiff !== 0) return pDiff;
      return a.day - b.day;
    });
  }, [records, periodOrder]);

  const getRecord = useCallback(
    (periodId: string, day: number): DayRecord => {
      const key = makeRecordKey(periodId, day);
      return records[key] ?? { periodId, day, memo: "", values: {} };
    },
    [records]
  );

  const setKeywordValue = useCallback(
    (periodId: string, day: number, keyword: KeywordDef, value: number | boolean) => {
      const key = makeRecordKey(periodId, day);
      const shouldForcePeriodStart = keyword.type === "event" && keyword.name.includes("생리") && day === 1;

      setRecords((prev) => {
        const before = prev[key] ?? { periodId, day, memo: "", values: {} };
        return {
          ...prev,
          [key]: {
            ...before,
            values: {
              ...before.values,
              [keyword.id]: shouldForcePeriodStart ? true : value,
            },
          },
        };
      });
    },
    [setRecords]
  );

  const setMemo = useCallback(
    (periodId: string, day: number, memo: string) => {
      const key = makeRecordKey(periodId, day);
      setRecords((prev) => {
        const before = prev[key] ?? { periodId, day, memo: "", values: {} };
        return {
          ...prev,
          [key]: {
            ...before,
            memo,
          },
        };
      });
    },
    [setRecords]
  );

  const getRecordsForPeriod = useCallback(
    (periodId: string) => {
      return Object.values(records)
        .filter((rec) => rec.periodId === periodId)
        .sort((a, b) => a.day - b.day)
        .map((rec) => {
          const metricCount = Object.values(rec.values).filter((v) => {
            if (typeof v === "number") return v > 0;
            return v === true;
          }).length;
          return {
            day: rec.day,
            metricCount,
            memo: rec.memo.trim(),
            values: rec.values,
          };
        });
    },
    [records]
  );

  const deleteRecordsForPeriod = useCallback(
    (periodId: string) => {
      setRecords((prev) => {
        const next: Record<string, DayRecord> = {};
        for (const [key, rec] of Object.entries(prev)) {
          if (rec.periodId === periodId) continue;
          next[key] = rec;
        }
        return next;
      });
    },
    [setRecords]
  );

  return {
    records,
    sortedRecords,
    getRecord,
    setKeywordValue,
    setMemo,
    getRecordsForPeriod,
    deleteRecordsForPeriod,
    setRecords,
  };
}
