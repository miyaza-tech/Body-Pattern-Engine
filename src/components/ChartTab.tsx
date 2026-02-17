import { useMemo } from "react";
import { LineChart } from "./LineChart";
import { Heatmap } from "./Heatmap";
import type { KeywordDef, GraphMode, DayRecord, HeatmapRow, ChartDataPoint, PeriodOption, LineSeries } from "../types";
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
  graphKeywordId: string;
  onSetGraphMode: (mode: GraphMode) => void;
  onSetGraphKeywordId: (id: string) => void;
  onChangePeriod: (periodId: string) => void;
}

// 값을 숫자로 변환 (체크형/이벤트/태그는 true=1, false=0)
function toNumericValue(val: number | boolean | undefined): number {
  if (typeof val === "boolean") return val ? 1 : 0;
  return Number(val ?? 0);
}

export function ChartTab({
  keywords,
  sortedRecords,
  periods,
  selectedPeriodId,
  graphMode,
  graphKeywordId,
  onSetGraphMode,
  onSetGraphKeywordId,
  onChangePeriod,
}: ChartTabProps) {
  // "all"이면 전체 보기, 아니면 개별 키워드
  const isAllKeywords = graphKeywordId === "all";
  
  const activeGraphKeywordId = useMemo(() => {
    if (graphKeywordId === "all") return "all";
    if (!keywords.length) return "";
    return keywords.some((k) => k.id === graphKeywordId) ? graphKeywordId : keywords[0].id;
  }, [keywords, graphKeywordId]);

  const cycleSeries = useMemo(() => {
    if (!activeGraphKeywordId) {
      return {
        avg: [] as ChartDataPoint[],
        current: [] as ChartDataPoint[],
      };
    }

    const buckets = new Map<number, number[]>();
    const currentMap = new Map<number, number>();

    for (const rec of sortedRecords) {
      const day = rec.day - 1;
      if (day < GRAPH_WINDOW_START || day > GRAPH_WINDOW_END) continue;

      const score = toNumericValue(rec.values[activeGraphKeywordId]);
      const list = buckets.get(day) ?? [];
      list.push(score);
      buckets.set(day, list);

      if (rec.periodId === selectedPeriodId) {
        currentMap.set(day, score);
      }
    }

    const avg = Array.from(
      { length: GRAPH_WINDOW_END - GRAPH_WINDOW_START + 1 },
      (_, idx) => {
        const day = GRAPH_WINDOW_START + idx;
        const list = buckets.get(day) ?? [];
        const value = list.length ? list.reduce((a, b) => a + b, 0) / list.length : 0;
        return { day, value: Number(value.toFixed(2)) };
      }
    );

    const current = Array.from(
      { length: GRAPH_WINDOW_END - GRAPH_WINDOW_START + 1 },
      (_, idx) => {
        const day = GRAPH_WINDOW_START + idx;
        return { day, value: Number(currentMap.get(day) ?? 0) };
      }
    );

    return { avg, current };
  }, [activeGraphKeywordId, sortedRecords, selectedPeriodId]);

  // 전체 키워드 평균 시리즈 (모든 키워드를 한꺼번에 표시)
  const allKeywordsSeries: LineSeries[] = useMemo(() => {
    if (!isAllKeywords) return [];
    
    return keywords.map((keyword, idx) => {
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
  }, [isAllKeywords, keywords, sortedRecords]);

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
          <div className="filter-row">
            <label htmlFor="chart-keyword-select">키워드</label>
            <select
              id="chart-keyword-select"
              value={activeGraphKeywordId}
              onChange={(e) => onSetGraphKeywordId(e.target.value)}
            >
              <option value="all">📊 전체 보기</option>
              {keywords.map((k) => (
                <option value={k.id} key={k.id}>
                  {k.name}
                </option>
              ))}
            </select>
          </div>
          <div className="chart-block">
            {isAllKeywords ? (
              <>
                <p>D{GRAPH_WINDOW_START} ~ D+{GRAPH_WINDOW_END} (전체 키워드 평균)</p>
                <LineChart
                  labels={Array.from(
                    { length: GRAPH_WINDOW_END - GRAPH_WINDOW_START + 1 },
                    (_, i) => String(GRAPH_WINDOW_START + i)
                  )}
                  series={allKeywordsSeries}
                />
                <div className="chart-legend">
                  {allKeywordsSeries.map((s) => (
                    <span key={s.name} className="legend-item">
                      <span className="legend-color" style={{ background: s.color }}></span>
                      {s.name}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <>
                <p>D{GRAPH_WINDOW_START} ~ D+{GRAPH_WINDOW_END} (평균 / 선택구간)</p>
                <LineChart
                  labels={cycleSeries.avg.map((p) => String(p.day))}
                  series={[
                    { name: "평균", color: "#ef7a7a", values: cycleSeries.avg.map((p) => p.value) },
                    { name: "선택구간", color: "#2563eb", values: cycleSeries.current.map((p) => p.value) },
                  ]}
                />
              </>
            )}
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
