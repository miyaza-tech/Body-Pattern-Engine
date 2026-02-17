import { useMemo } from "react";
import type { KeywordDef, DayRecordSummary, PeriodOption } from "../types";

interface GraphTabProps {
  keywords: KeywordDef[];
  periods: PeriodOption[];
  selectedPeriodId: string;
  periodRecords: DayRecordSummary[];
  onNavigateToRecord: (day: number) => void;
  onChangePeriod: (periodId: string) => void;
  selectedPeriod: { year: number; label: string; days: number };
}

export function GraphTab({
  keywords,
  periods,
  selectedPeriodId,
  periodRecords,
  onNavigateToRecord,
  onChangePeriod,
  selectedPeriod,
}: GraphTabProps) {
  // 키워드 ID -> 이름 맵
  const keywordNameMap = useMemo(() => {
    const map = new Map<string, string>();
    keywords.forEach((k) => map.set(k.id, k.name));
    return map;
  }, [keywords]);

  // 활성화된 키워드 이름 배열 반환
  const getActiveKeywordNames = (values: Record<string, number | boolean>): string[] => {
    const names: string[] = [];
    for (const [id, val] of Object.entries(values)) {
      const isActive = typeof val === "number" ? val > 0 : val === true;
      if (isActive) {
        const name = keywordNameMap.get(id);
        if (name) {
          const displayVal = typeof val === "number" && val > 0 ? `${name}(${val})` : name;
          names.push(displayVal);
        }
      }
    }
    return names;
  };

  return (
    <section className="card" aria-labelledby="graph-tab-title">
      <h2 id="graph-tab-title">월별 기록</h2>

      {/* 월구간 선택 */}
      {periods.length > 0 && (
        <div className="filter-row period-select">
          <label htmlFor="graph-period-select">월구간</label>
          <select
            id="graph-period-select"
            value={selectedPeriodId}
            onChange={(e) => onChangePeriod(e.target.value)}
          >
            {periods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.year}년 {p.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 선택 월구간 기록 - 바로 표시 */}
      {periods.length > 0 && (
        <div className="record-section">
          <h3>{selectedPeriod.year}년 {selectedPeriod.label} ({selectedPeriod.days}일)</h3>
          <div className="month-simple-list">
            {Array.from({ length: selectedPeriod.days }, (_, i) => i + 1).map((day) => {
              const record = periodRecords.find((r) => r.day === day);
              const activeNames = record ? getActiveKeywordNames(record.values) : [];
              const memoText = record?.memo ? `(${record.memo})` : "";
              
              return (
                <div 
                  key={day} 
                  className="month-simple-row"
                  onClick={() => onNavigateToRecord(day)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && onNavigateToRecord(day)}
                >
                  <span className="day-num">{day}일</span>
                  <span className="day-text">
                    {activeNames.length > 0 ? activeNames.join(" ") : "-"}
                    {memoText && <span className="memo-inline"> {memoText}</span>}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

