import type { KeywordDef, PeriodOption } from "../types";

export const STORAGE_KEYS = {
  keywords: "bpe_mvp_keywords_v1",
  records: "bpe_mvp_records_v1",
  periods: "bpe_mvp_periods_v1",
  theme: "bpe_mvp_theme_v1",
} as const;

export const CURRENT_YEAR = new Date().getFullYear();

export const DEFAULT_KEYWORDS: KeywordDef[] = [];

export const DEFAULT_PERIOD_OPTIONS: PeriodOption[] = [];

export const GRAPH_WINDOW_START = -2;
export const GRAPH_WINDOW_END = 31;

/** 내부 day 값을 표시용 라벨로 변환 (0 건너뛰기: -2,-1,1,2,...,32) */
export function dayToLabel(day: number): string {
  return day < 0 ? String(day) : String(day + 1);
}

// 차트 색상
export const CHART_COLORS = {
  average: "#ef7a7a",
  current: "#2563eb",
  scale: ["#ffffff", "#fde0e0", "#f8a4a4", "#dc4c4c"],
} as const;

// 테마 색상
export const THEME = {
  light: {
    background: "#f7f8fb",
    cardBackground: "#ffffff",
    text: "#121212",
    textSecondary: "#4d4d4d",
    border: "#e7e7e7",
    primary: "#1f2937",
    primaryText: "#ffffff",
  },
  dark: {
    background: "#121212",
    cardBackground: "#1e1e1e",
    text: "#e4e4e4",
    textSecondary: "#a0a0a0",
    border: "#333333",
    primary: "#3b82f6",
    primaryText: "#ffffff",
  },
} as const;
