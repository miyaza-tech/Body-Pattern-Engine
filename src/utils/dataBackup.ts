import type { KeywordDef, DayRecord, PeriodOption } from "../types";
import { STORAGE_KEYS } from "../constants/defaults";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

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

    // 파일 크기 제한 (5MB)
    if (file.size > MAX_FILE_SIZE) {
      onError("파일 크기가 너무 큽니다. (최대 5MB)");
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

      // 키워드 스키마 검증
      const validKeywordTypes = ["scale", "check", "event", "tag"];
      for (const kw of data.keywords) {
        if (
          typeof kw.id !== "string" ||
          typeof kw.name !== "string" ||
          !validKeywordTypes.includes(kw.type)
        ) {
          onError("키워드 데이터 형식이 올바르지 않습니다.");
          return;
        }
        // XSS 방지: HTML 태그 제거
        kw.name = kw.name.replace(/<[^>]*>/g, "");
      }

      // 레코드 스키마 검증
      for (const [dateKey, record] of Object.entries(data.records)) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
          onError("기록 날짜 형식이 올바르지 않습니다.");
          return;
        }
        const r = record as DayRecord;
        if (typeof r.periodId !== "string" || typeof r.day !== "number") {
          onError("기록 데이터 형식이 올바르지 않습니다.");
          return;
        }
        // 메모 XSS 방지
        if (r.memo) {
          r.memo = String(r.memo).replace(/<[^>]*>/g, "");
        }
      }

      // 기간 스키마 검증
      for (const period of data.periods) {
        if (
          typeof period.id !== "string" ||
          typeof period.year !== "number" ||
          typeof period.label !== "string" ||
          typeof period.days !== "number"
        ) {
          onError("기간 데이터 형식이 올바르지 않습니다.");
          return;
        }
        period.label = period.label.replace(/<[^>]*>/g, "");
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
