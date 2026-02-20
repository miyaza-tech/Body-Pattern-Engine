import { useMemo, useState } from "react";
import { LineChart } from "./LineChart";
import { Heatmap } from "./Heatmap";
import type { KeywordDef, GraphMode, DayRecord, HeatmapRow, PeriodOption, LineSeries } from "../types";
import { GRAPH_WINDOW_START, GRAPH_WINDOW_END } from "../constants/defaults";

// 키워드별 색상 팔레트
const KEYWORD_COLORS = [
  "#ef7a7a", "#2563eb", "#10b981", "#f59e0b", "#8b5cf6",
  "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1",
  "#14b8a6", "#eab308", "#a855f7", "#22c55e", "#3b82f6",
];

interface ChartTabProps {
  keywords: KeywordDef[];
  sortedRecords: DayRecord[];
  periods: PeriodOption[];
  selectedPeriodId: string;
  graphMode: GraphMode;
  onSetGraphMode: (mode: GraphMode) => void;
  onChangePeriod: (periodId: string) => void;
}

// 값을 숫자로 변환 (체크형/이벤트/태그는 true=1, false=0)
// 체크형은 true일 때 3으로 변환 (scale형 최대값과 동일하게 표시)
function toNumericValue(val: number | boolean | undefined): number {
  if (typeof val === "boolean") return val ? 3 : 0;
  return Number(val ?? 0);
}

export function ChartTab({
  keywords,
  sortedRecords,
  periods,
  selectedPeriodId,
  graphMode,
  onSetGraphMode,
  onChangePeriod,
}: ChartTabProps) {
  // 선택된 키워드 ID들 (비어있으면 전체)
  const [selectedKeywordIds, setSelectedKeywordIds] = useState<Set<string>>(new Set());
  
  // 전체 보기 모드인지 (선택된 키워드가 없으면 전체)
  const isAllKeywords = selectedKeywordIds.size === 0;
  
  // 표시할 키워드 목록
  const displayKeywords = useMemo(() => {
    if (isAllKeywords) return keywords;
    return keywords.filter(k => selectedKeywordIds.has(k.id));
  }, [keywords, selectedKeywordIds, isAllKeywords]);

  // 선택된 키워드들의 평균 시리즈
  const keywordsSeries: LineSeries[] = useMemo(() => {
    return displayKeywords.map((keyword, idx) => {
      const buckets = new Map<number, number[]>();
      
      for (const rec of sortedRecords) {
        const day = rec.day - 1;
        if (day < GRAPH_WINDOW_START || day > GRAPH_WINDOW_END) continue;
        
        const score = toNumericValue(rec.values[keyword.id]);
        const list = buckets.get(day) ?? [];
        list.push(score);
        buckets.set(day, list);
      }
      
      const values = Array.from(
        { length: GRAPH_WINDOW_END - GRAPH_WINDOW_START + 1 },
        (_, i) => {
          const day = GRAPH_WINDOW_START + i;
          const list = buckets.get(day) ?? [];
          return list.length ? Number((list.reduce((a, b) => a + b, 0) / list.length).toFixed(2)) : 0;
        }
      );
      
      return {
        name: keyword.name,
        color: KEYWORD_COLORS[idx % KEYWORD_COLORS.length],
        values,
      };
    });
  }, [displayKeywords, sortedRecords]);

  const heatmapData: HeatmapRow[] = useMemo(() => {
    return keywords.map((keyword) => {
      const cells = Array.from(
        { length: GRAPH_WINDOW_END - GRAPH_WINDOW_START + 1 },
        (_, idx) => {
          const day = GRAPH_WINDOW_START + idx;
          const vals = sortedRecords
            .filter((rec) => rec.day - 1 === day)
            .map((rec) => toNumericValue(rec.values[keyword.id]));
          const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
          return { day, value: Number(avg.toFixed(2)) };
        }
      );

      return { keyword, cells };
    });
  }, [keywords, sortedRecords]);

  return (
    <section className="card" aria-labelledby="chart-tab-title">
      <h2 id="chart-tab-title">그래프</h2>

      {/* 월구간 선택 */}
      {periods.length > 0 && (
        <div className="filter-row period-select">
          <label htmlFor="chart-period-select">월구간</label>
          <select
            id="chart-period-select"
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

      {/* 모드 선택 */}
      <div className="mode-tabs" role="tablist" aria-label="그래프 모드">
        <button
          className={graphMode === "cycle" ? "active" : ""}
          onClick={() => onSetGraphMode("cycle")}
          role="tab"
          aria-selected={graphMode === "cycle"}
        >
          주기기준
        </button>
        <button
          className={graphMode === "heatmap" ? "active" : ""}
          onClick={() => onSetGraphMode("heatmap")}
          role="tab"
          aria-selected={graphMode === "heatmap"}
        >
          히트맵
        </button>
      </div>

      {/* 주기기준 그래프 */}
      {keywords.length > 0 && graphMode === "cycle" && (
        <>
          <div className="keyword-filter-row chart-keywords">
            <span className="filter-label">키워드 선택:</span>
            <div className="keyword-filter-chips">
              {keywords.map((kw) => (
                <button
                  key={kw.id}
                  className={`keyword-chip ${selectedKeywordIds.has(kw.id) ? 'active' : ''}`}
                  onClick={() => {
                    const newSet = new Set(selectedKeywordIds);
                    if (newSet.has(kw.id)) {
                      newSet.delete(kw.id);
                    } else {
                      newSet.add(kw.id);
                    }
                    setSelectedKeywordIds(newSet);
                  }}
                >
                  {kw.name}
                </button>
              ))}
              {selectedKeywordIds.size > 0 && (
                <button 
                  className="keyword-chip clear"
                  onClick={() => setSelectedKeywordIds(new Set())}
                >
                  ✕ 초기화
                </button>
              )}
            </div>
          </div>
          <div className="chart-block">
            <p>D{GRAPH_WINDOW_START} ~ D+{GRAPH_WINDOW_END} ({isAllKeywords ? '전체' : `${selectedKeywordIds.size}개`} 키워드 평균)</p>
            <LineChart
              labels={Array.from(
                { length: GRAPH_WINDOW_END - GRAPH_WINDOW_START + 1 },
                (_, i) => String(GRAPH_WINDOW_START + i)
              )}
              series={keywordsSeries}
            />
            <div className="chart-legend">
              {keywordsSeries.map((s) => (
                <span key={s.name} className="legend-item">
                  <span className="legend-color" style={{ background: s.color }}></span>
                  {s.name}
                </span>
              ))}
            </div>
          </div>
        </>
      )}

      {/* 히트맵 */}
      {graphMode === "heatmap" && (
        <div className="chart-block heatmap-wrap">
          <Heatmap
            data={heatmapData}
            windowStart={GRAPH_WINDOW_START}
            windowEnd={GRAPH_WINDOW_END}
          />
        </div>
      )}
    </section>
  );
}
