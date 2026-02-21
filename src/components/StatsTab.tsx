import type { CyclePrediction, DayRecord, KeywordDef } from "../types";

interface StatsTabProps {
  prediction: CyclePrediction;
  sortedRecords: DayRecord[];
  scaleKeywords: KeywordDef[];
  onExportData: () => void;
  onImportData: () => void;
}

export function StatsTab({
  prediction,
  sortedRecords,
  scaleKeywords,
  onExportData,
  onImportData,
}: StatsTabProps) {
  const totalRecords = sortedRecords.length;
  
  // 가장 많이 기록된 증상 계산
  const symptomCounts = scaleKeywords.map((keyword) => {
    const count = sortedRecords.filter((rec) => {
      const val = rec.values[keyword.id];
      return typeof val === "number" && val > 0;
    }).length;
    return { keyword, count };
  }).sort((a, b) => b.count - a.count);

  const topSymptom = symptomCounts[0];

  // 평균 강도 계산
  const avgIntensities = scaleKeywords.map((keyword) => {
    const values = sortedRecords
      .map((rec) => Number(rec.values[keyword.id] ?? 0))
      .filter((v) => v > 0);
    const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    return { keyword, avg: Number(avg.toFixed(2)) };
  }).sort((a, b) => b.avg - a.avg);

  const formatDate = (date: Date | null) => {
    if (!date) return "데이터 부족";
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getConfidenceLabel = (confidence: CyclePrediction["confidence"]) => {
    switch (confidence) {
      case "high":
        return "높음";
      case "medium":
        return "보통";
      case "low":
        return "낮음";
    }
  };

  return (
    <section className="card" aria-labelledby="stats-tab-title">
      <h2 id="stats-tab-title">리포트</h2>

      {/* 주기 예측 */}
      <div className="record-section">
        <h3>주기 예측</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-label">평균 주기</span>
            <span className="stat-value">
              {prediction.averageCycleLength > 0 ? `${prediction.averageCycleLength}일` : "데이터 부족"}
            </span>
          </div>
          <div className="stat-card">
            <span className="stat-label">다음 예상일</span>
            <span className="stat-value">{formatDate(prediction.nextPeriodDate)}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">남은 일수</span>
            <span className="stat-value">
              {prediction.daysUntilNextPeriod !== null
                ? `D-${prediction.daysUntilNextPeriod}`
                : "데이터 부족"}
            </span>
          </div>
          <div className="stat-card">
            <span className="stat-label">예측 신뢰도</span>
            <span className={`stat-value confidence-${prediction.confidence}`}>
              {getConfidenceLabel(prediction.confidence)}
            </span>
          </div>
        </div>
        <p className="stats-help">
          * 최소 2회 이상의 생리 기록이 필요합니다. 기록이 많을수록 예측 정확도가 높아집니다.
        </p>
      </div>

      {/* 기록 통계 */}
      <div className="record-section">
        <h3>기록 통계</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-label">총 기록 수</span>
            <span className="stat-value">{totalRecords}개</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">가장 빈번한 증상</span>
            <span className="stat-value">
              {topSymptom ? `${topSymptom.keyword.name} (${topSymptom.count}회)` : "-"}
            </span>
          </div>
        </div>
      </div>

      {/* 평균 증상 강도 */}
      {avgIntensities.length > 0 && (
        <div className="record-section">
          <h3>평균 증상 강도</h3>
          <div className="intensity-list">
            {avgIntensities.slice(0, 5).map(({ keyword, avg }) => (
              <div key={keyword.id} className="intensity-row">
                <span className="intensity-name">{keyword.name}</span>
                <div className="intensity-bar-container">
                  <div
                    className="intensity-bar"
                    style={{ width: `${(avg / 3) * 100}%` }}
                    role="progressbar"
                    aria-valuenow={avg}
                    aria-valuemin={0}
                    aria-valuemax={3}
                  />
                </div>
                <span className="intensity-value">{avg}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 데이터 관리 */}
      <div className="record-section">
        <h3>데이터 관리</h3>
        <p className="stats-help">
          데이터는 브라우저 로컬 저장소에 저장됩니다. 브라우저 데이터를 삭제하면 기록이 사라질 수 있으니 정기적으로 백업하세요.
        </p>
        <div className="data-actions">
          <button onClick={onExportData} className="btn-primary">
            내보내기
          </button>
          <button onClick={onImportData} className="btn-secondary">
            가져오기
          </button>
        </div>
      </div>
    </section>
  );
}
