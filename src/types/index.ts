// ===== 키워드 타입 =====
export type KeywordType = "scale" | "check" | "event" | "tag";

export interface KeywordDef {
  id: string;
  name: string;
  type: KeywordType;
}

// ===== 기록 타입 =====
export interface DayRecord {
  periodId: string;
  day: number;
  values: Record<string, number | boolean>;
  memo: string;
}

// ===== 월구간 타입 =====
export interface PeriodOption {
  id: string;
  year: number;
  label: string;
  days: number;
  startDayOfWeek?: number; // 0=일, 1=월, 2=화, 3=수, 4=목, 5=금, 6=토
}

// ===== 탭/모드 타입 =====
export type Tab = "keywords" | "record" | "graph" | "chart";
export type GraphMode = "cycle" | "heatmap";

// ===== 차트 타입 =====
export interface LineSeries {
  name: string;
  color: string;
  values: number[];
  isDashed?: boolean;
}

export interface ChartDataPoint {
  day: number;
  value: number;
}

// ===== 히트맵 타입 =====
export interface HeatmapRow {
  keyword: KeywordDef;
  cells: ChartDataPoint[];
}

// ===== 기록 요약 타입 =====
export interface DayRecordSummary {
  day: number;
  metricCount: number;
  memo: string;
  values: Record<string, number | boolean>;
}

// ===== 주기 예측 타입 =====
export interface CyclePrediction {
  averageCycleLength: number;
  nextPeriodDate: Date | null;
  daysUntilNextPeriod: number | null;
  cycleHistory: number[];
  confidence: "low" | "medium" | "high";
}

// ===== 토스트 타입 =====
export type ToastType = "success" | "error" | "info";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}
