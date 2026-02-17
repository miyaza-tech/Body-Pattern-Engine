import type { LineSeries } from "../types";

interface LineChartProps {
  labels: string[];
  series: LineSeries[];
  maxY?: number;
}

export function LineChart({ labels, series, maxY = 3 }: LineChartProps) {
  if (!labels.length || !series.length) {
    return <p className="chart-empty">데이터가 아직 없습니다.</p>;
  }

  const padding = 24;
  const chartHeight = 200;
  const stepX = 28;
  const chartWidth = Math.max(320, labels.length * stepX + padding * 2);
  const plotHeight = chartHeight - padding * 2;
  const safeMaxY = maxY <= 0 ? 1 : maxY;

  const xFor = (idx: number) => {
    if (labels.length === 1) return chartWidth / 2;
    return padding + (idx / (labels.length - 1)) * (chartWidth - padding * 2);
  };

  const yFor = (value: number) => {
    const v = Math.max(0, Math.min(safeMaxY, value));
    return padding + ((safeMaxY - v) / safeMaxY) * plotHeight;
  };

  return (
    <div className="line-chart-wrap">
      <div className="line-legend" role="list" aria-label="차트 범례">
        {series.map((s) => (
          <span key={s.name} role="listitem">
            <i style={{ backgroundColor: s.color }} aria-hidden="true" />
            {s.name}
          </span>
        ))}
      </div>
      <svg
        className="line-chart"
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        preserveAspectRatio="none"
        role="img"
        aria-label="증상 강도 라인 차트"
      >
        {/* Y축 그리드 라인 */}
        {[0, 1, 2, 3].map((v) => {
          const y = yFor(v);
          return (
            <g key={v}>
              <line x1={padding} y1={y} x2={chartWidth - padding} y2={y} className="grid-line" />
              <text x={6} y={y + 4} className="axis-text" aria-hidden="true">
                {v}
              </text>
            </g>
          );
        })}

        {/* 데이터 라인 */}
        {series.map((s) => {
          const points = s.values.map((value, idx) => `${xFor(idx)},${yFor(value)}`).join(" ");
          return (
            <g key={s.name}>
              <polyline fill="none" stroke={s.color} strokeWidth={2.5} points={points} />
              {s.values.map((value, idx) => (
                <circle
                  key={`${s.name}-${idx}`}
                  cx={xFor(idx)}
                  cy={yFor(value)}
                  r={2.8}
                  fill={s.color}
                >
                  <title>{`${labels[idx]}: ${value}`}</title>
                </circle>
              ))}
            </g>
          );
        })}

        {/* X축 레이블 */}
        {labels.map((label, idx) => {
          const show =
            labels.length <= 12 ||
            idx % Math.ceil(labels.length / 10) === 0 ||
            idx === labels.length - 1;
          if (!show) return null;
          return (
            <text
              key={`${label}-${idx}`}
              x={xFor(idx)}
              y={chartHeight - 4}
              textAnchor="middle"
              className="axis-text"
            >
              {label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
