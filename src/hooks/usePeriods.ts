import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";
import type { PeriodOption } from "../types";
import { STORAGE_KEYS, DEFAULT_PERIOD_OPTIONS, CURRENT_YEAR } from "../constants/defaults";

function safeParsePeriods(raw: string | null): PeriodOption[] {
  if (!raw) return DEFAULT_PERIOD_OPTIONS;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_PERIOD_OPTIONS;

    const normalized = parsed
      .filter((item) => item && typeof item === "object")
      .map((item) => ({
        id: String(item.id ?? "").trim(),
        year: Number(item.year ?? CURRENT_YEAR),
        label: String(item.label ?? "").trim(),
        days: Number(item.days ?? 0),
      }))
      .filter(
        (item) =>
          item.id.length > 0 &&
          item.label.length > 0 &&
          Number.isFinite(item.year) &&
          item.year >= 1900 &&
          Number.isFinite(item.days) &&
          item.days >= 1
      );

    return normalized;
  } catch {
    return DEFAULT_PERIOD_OPTIONS;
  }
}

function generatePeriodId(label: string): string {
  const idBase = label
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_가-힣~-]/g, "")
    .slice(0, 24);
  return `${idBase || "period"}_${Date.now().toString(36)}`;
}

export function usePeriods() {
  const [periods, setPeriods] = useLocalStorage<PeriodOption[]>(
    STORAGE_KEYS.periods,
    DEFAULT_PERIOD_OPTIONS,
    safeParsePeriods
  );

  const getPeriod = useCallback(
    (periodId: string): PeriodOption => {
      if (!periods.length) {
        return { id: "", year: CURRENT_YEAR, label: "없음", days: 31 };
      }
      return periods.find((p) => p.id === periodId) ?? periods[0];
    },
    [periods]
  );

  const addPeriod = useCallback(
    (year: number, label: string, days: number) => {
      const trimmedLabel = label.trim();
      if (!trimmedLabel || !Number.isFinite(year) || year < 1900 || !Number.isFinite(days) || days < 1) {
        return false;
      }

      const id = generatePeriodId(trimmedLabel);
      setPeriods((prev) => [...prev, { id, year, label: trimmedLabel, days }]);
      return true;
    },
    [setPeriods]
  );

  const deletePeriod = useCallback(
    (periodId: string, deleteRecords: (periodId: string) => void) => {
      deleteRecords(periodId);
      return true;
    },
    [setPeriods]
  );

  const resetToDefaults = useCallback(() => {
    setPeriods(DEFAULT_PERIOD_OPTIONS);
  }, [setPeriods]);

  const periodOrder = useCallback(
    (periodId: string): number => {
      const idx = periods.findIndex((p) => p.id === periodId);
      if (idx < 0) return 999999;
      const p = periods[idx];
      return p.year * 1000 + idx;
    },
    [periods]
  );

  return {
    periods,
    getPeriod,
    addPeriod,
    deletePeriod,
    resetToDefaults,
    periodOrder,
    setPeriods,
  };
}
