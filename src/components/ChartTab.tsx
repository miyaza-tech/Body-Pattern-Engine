import { useMemo } from "react";
import { LineChart } from "./LineChart";
import { Heatmap } from "./Heatmap";
import type { KeywordDef, GraphMode, DayRecord, HeatmapRow, ChartDataPoint, PeriodOption } from "../types";
import { GRAPH_WINDOW_START, GRAPH_WINDOW_END } from "../constants/defaults";

interface ChartTabProps {
  scaleKeywords: KeywordDef[];
  sortedRecords: DayRecord[];
  periods: PeriodOption[];
  selectedPeriodId: string;
  graphMode: GraphMode;
  graphKeywordId: string;
  onSetGraphMode: (mode: GraphMode) => void;
  onSetGraphKeywordId: (id: string) => void;
  onChangePeriod: (periodId: string) => void;
}

export function ChartTab({
  scaleKeywords,
  sortedRecords,
  periods,
  selectedPeriodId,
  graphMode,
  graphKeywordId,
  onSetGraphMode,
  onSetGraphKeywordId,
  onChangePeriod,
}: ChartTabProps) {
  const activeGraphKeywordId = useMemo(() => {
    if (!scaleKeywords.length) return "";
    return scaleKeywords.some((k) => k.id === graphKeywordId) ? graphKeywordId : scaleKeywords[0].id;
  }, [scaleKeywords, graphKeywordId]);

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

      const score = Number(rec.values[activeGraphKeywordId] ?? 0);
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

  const heatmapData: HeatmapRow[] = useMemo(() => {
    return scaleKeywords.map((keyword) => {
      const cells = Array.from(
        { length: GRAPH_WINDOW_END - GRAPH_WINDOW_START + 1 },
        (_, idx) => {
          const day = GRAPH_WINDOW_START + idx;
          const vals = sortedRecords
            .filter((rec) => rec.day - 1 === day)
            .map((rec) => Number(rec.values[keyword.id] ?? 0));
          const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
          return { day, value: Number(avg.toFixed(2)) };
        }
      );

      return { keyword, cells };
    });
  }, [scaleKeywords, sortedRecords]);

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
      {scaleKeywords.length > 0 && graphMode === "cycle" && (
        <>
          <div className="filter-row">
            <label htmlFor="chart-keyword-select">키워드</label>
            <select
              id="chart-keyword-select"
              value={activeGraphKeywordId}
              onChange={(e) => onSetGraphKeywordId(e.target.value)}
            >
              {scaleKeywords.map((k) => (
                <option value={k.id} key={k.id}>
                  {k.name}
                </option>
              ))}
            </select>
          </div>
          <div className="chart-block">
            <p>D-10 ~ D+20 (평균 / 선택구간)</p>
            <LineChart
              labels={cycleSeries.avg.map((p) => String(p.day))}
              series={[
                { name: "평균", color: "#ef7a7a", values: cycleSeries.avg.map((p) => p.value) },
                { name: "선택구간", color: "#2563eb", values: cycleSeries.current.map((p) => p.value) },
              ]}
            />
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
