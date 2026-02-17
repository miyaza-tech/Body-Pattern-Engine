import type { KeywordDef, PeriodOption } from "../types";

export const STORAGE_KEYS = {
  keywords: "bpe_mvp_keywords_v1",
  records: "bpe_mvp_records_v1",
  periods: "bpe_mvp_periods_v1",
  theme: "bpe_mvp_theme_v1",
} as const;

export const CURRENT_YEAR = new Date().getFullYear();

export const DEFAULT_KEYWORDS: KeywordDef[] = [
  { id: "leg_pain", name: "다리저림", type: "scale" },
  { id: "headache", name: "두통", type: "scale" },
  { id: "fatigue", name: "피곤", type: "scale" },
  { id: "morning_stiff", name: "아침찌뿌둥", type: "scale" },
  { id: "acne", name: "여드름", type: "scale" },
  { id: "swelling", name: "붓기", type: "scale" },
  { id: "diarrhea", name: "설사", type: "check" },
  { id: "good_bowel", name: "굿똥", type: "check" },
  { id: "brown_spot", name: "갈색냉", type: "check" },
  { id: "period_start", name: "생리터짐", type: "event" },
  { id: "sex", name: "S", type: "check" },
  { id: "magnesium", name: "마그네슘", type: "tag" },
];

export const DEFAULT_PERIOD_OPTIONS: PeriodOption[] = [];

export const GRAPH_WINDOW_START = -7;
export const GRAPH_WINDOW_END = 35;

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
