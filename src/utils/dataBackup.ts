import type { KeywordDef, DayRecord, PeriodOption } from "../types";
import { STORAGE_KEYS } from "../constants/defaults";

interface ExportData {
  version: string;
  exportedAt: string;
  keywords: KeywordDef[];
  records: Record<string, DayRecord>;
  periods: PeriodOption[];
}

export function exportAllData(): void {
  const data: ExportData = {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    keywords: JSON.parse(localStorage.getItem(STORAGE_KEYS.keywords) ?? "[]"),
    records: JSON.parse(localStorage.getItem(STORAGE_KEYS.records) ?? "{}"),
    periods: JSON.parse(localStorage.getItem(STORAGE_KEYS.periods) ?? "[]"),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `body-pattern-engine-backup-${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importData(
  onSuccess: (data: { keywords: KeywordDef[]; records: Record<string, DayRecord>; periods: PeriodOption[] }) => void,
  onError: (message: string) => void
): void {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";

  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) {
      onError("파일을 선택해주세요.");
      return;
    }

    try {
      const text = await file.text();
      const data = JSON.parse(text) as ExportData;

      // 기본 유효성 검사
      if (!data.version || !data.keywords || !data.records || !data.periods) {
        onError("올바른 백업 파일이 아닙니다.");
        return;
      }

      if (!Array.isArray(data.keywords) || !Array.isArray(data.periods)) {
        onError("데이터 형식이 올바르지 않습니다.");
        return;
      }

      // LocalStorage에 저장
      localStorage.setItem(STORAGE_KEYS.keywords, JSON.stringify(data.keywords));
      localStorage.setItem(STORAGE_KEYS.records, JSON.stringify(data.records));
      localStorage.setItem(STORAGE_KEYS.periods, JSON.stringify(data.periods));

      onSuccess({
        keywords: data.keywords,
        records: data.records,
        periods: data.periods,
      });
    } catch {
      onError("파일을 읽는 중 오류가 발생했습니다.");
    }
  };

  input.click();
}
