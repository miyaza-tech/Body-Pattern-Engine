import type { HeatmapRow } from "../types";

interface HeatmapProps {
  data: HeatmapRow[];
  windowStart: number;
  windowEnd: number;
}

function scoreToColor(score: number): string {
  if (score <= 0) return "var(--color-heatmap-0)";
  if (score <= 1) return "var(--color-heatmap-1)";
  if (score <= 2) return "var(--color-heatmap-2)";
  return "var(--color-heatmap-3)";
}

export function Heatmap({ data, windowStart, windowEnd }: HeatmapProps) {
  if (data.length === 0) {
    return <p className="chart-empty">데이터가 아직 없습니다.</p>;
  }

  const days = Array.from(
    { length: windowEnd - windowStart + 1 },
    (_, i) => windowStart + i
  );

  return (
    <div className="heatmap-scroll-container">
      <table className="heatmap-table" role="grid" aria-label="증상 히트맵">
        <thead>
          <tr>
            <th scope="col">키워드</th>
            {days.map((day) => (
              <th key={day} scope="col" aria-label={`D${day >= 0 ? "+" : ""}${day}`}>
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.keyword.id}>
              <th scope="row">{row.keyword.name}</th>
              {row.cells.map((cell) => (
                <td
                  key={`${row.keyword.id}-${cell.day}`}
                  style={{ backgroundColor: scoreToColor(cell.value) }}
                  title={`${row.keyword.name} D${cell.day}: ${cell.value.toFixed(1)}`}
                  aria-label={`${row.keyword.name} D${cell.day}: ${cell.value.toFixed(1)}`}
                >
                  {cell.value.toFixed(1)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
