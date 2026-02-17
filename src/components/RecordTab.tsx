import type { KeywordDef, KeywordType, DayRecord, PeriodOption } from "../types";

interface RecordTabProps {
  periods: PeriodOption[];
  selectedPeriodId: string;
  selectedDay: number;
  currentRecord: DayRecord;
  grouped: Record<KeywordType, KeywordDef[]>;
  onChangePeriod: (periodId: string) => void;
  onChangeDay: (day: number) => void;
  onPrevDay: () => void;
  onNextDay: () => void;
  onSetKeywordValue: (keyword: KeywordDef, value: number | boolean) => void;
  onSetMemo: (memo: string) => void;
  selectedPeriod: PeriodOption;
}

export function RecordTab({
  periods,
  selectedPeriodId,
  selectedDay,
  currentRecord,
  grouped,
  onChangePeriod,
  onChangeDay,
  onPrevDay,
  onNextDay,
  onSetKeywordValue,
  onSetMemo,
  selectedPeriod,
}: RecordTabProps) {
  const dayStatus = selectedDay <= 1 ? "D0" : `D+${selectedDay - 1}`;

  return (
    <section className="card" aria-labelledby="record-tab-title">
      <h2 id="record-tab-title">날짜별 기록</h2>

      {/* 날짜 네비게이션 */}
      {periods.length === 0 ? (
        <div className="empty-notice">
          <p>기록을 시작하려면 먼저 <strong>월구간을 추가</strong>하세요.</p>
          <p>"월별" 탭에서 월구간을 추가할 수 있습니다.</p>
        </div>
      ) : (
        <>
          <nav className="date-nav" aria-label="날짜 선택">
            <button onClick={onPrevDay} aria-label="이전 날짜">
              ◀
            </button>
            <select
              value={selectedPeriodId}
              onChange={(e) => onChangePeriod(e.target.value)}
              aria-label="월구간 선택"
            >
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.year}년 {p.label}
                </option>
              ))}
            </select>
            <select
              value={selectedDay}
              onChange={(e) => onChangeDay(Number(e.target.value))}
              aria-label="일자 선택"
            >
              {Array.from({ length: selectedPeriod.days }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  {d}일
                </option>
              ))}
            </select>
            <button onClick={onNextDay} aria-label="다음 날짜">
              ▶
            </button>
          </nav>
          <p className="d-status" aria-live="polite">
            현재 상태: <strong>{dayStatus}</strong>
          </p>
          <p className="period-help">1일은 생리시작일(D0)로 처리됩니다. 변경사항은 자동 저장됩니다.</p>
        </>
      )}

      {/* 강도형 */}
      {periods.length > 0 && (
      <div className="record-section">
        <h3>강도형</h3>
        {grouped.scale.map((keyword) => {
          const current = Number(currentRecord.values[keyword.id] ?? 0);
          return (
            <div key={keyword.id} className="scale-row">
              <span>{keyword.name}</span>
              <div className="level-buttons" role="radiogroup" aria-label={`${keyword.name} 강도`}>
                {[0, 1, 2, 3].map((n) => (
                  <button
                    key={n}
                    className={current === n ? "active" : ""}
                    onClick={() => onSetKeywordValue(keyword, n)}
                    role="radio"
                    aria-checked={current === n}
                    aria-label={`강도 ${n}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* 체크형 */}
      {periods.length > 0 && (
      <div className="record-section">
        <h3>체크형</h3>
        <div className="chip-list" role="group" aria-label="체크형 키워드">
          {grouped.check.map((keyword) => {
            const on = Boolean(currentRecord.values[keyword.id]);
            return (
              <button
                key={keyword.id}
                className={on ? "chip active" : "chip"}
                onClick={() => onSetKeywordValue(keyword, !on)}
                aria-pressed={on}
              >
                {keyword.name}
              </button>
            );
          })}
        </div>
      </div>
      )}

      {/* 이벤트 */}
      {periods.length > 0 && (
      <div className="record-section">
        <h3>이벤트</h3>
        <div className="chip-list" role="group" aria-label="이벤트 키워드">
          {grouped.event.map((keyword) => {
            const forced = keyword.name.includes("생리") && selectedDay === 1;
            const on = forced || Boolean(currentRecord.values[keyword.id]);
            return (
              <button
                key={keyword.id}
                className={on ? "chip event active" : "chip event"}
                onClick={() => {
                  if (!forced) onSetKeywordValue(keyword, !on);
                }}
                aria-pressed={on}
                aria-disabled={forced}
                disabled={forced}
              >
                {keyword.name}
                {forced ? " (고정)" : ""}
              </button>
            );
          })}
        </div>
      </div>
      )}

      {/* 태그 */}
      {periods.length > 0 && (
      <div className="record-section">
        <h3>태그</h3>
        <div className="chip-list" role="group" aria-label="태그 키워드">
          {grouped.tag.map((keyword) => {
            const on = Boolean(currentRecord.values[keyword.id]);
            return (
              <button
                key={keyword.id}
                className={on ? "chip tag active" : "chip tag"}
                onClick={() => onSetKeywordValue(keyword, !on)}
                aria-pressed={on}
              >
                {keyword.name}
              </button>
            );
          })}
        </div>
      </div>
      )}

      {/* 메모 */}
      {periods.length > 0 && (
      <div className="memo-box">
        <label htmlFor="daily-memo">메모 (선택)</label>
        <textarea
          id="daily-memo"
          value={currentRecord.memo}
          onChange={(e) => onSetMemo(e.target.value)}
          rows={2}
          placeholder="오늘의 특이사항을 기록하세요..."
        />
      </div>
      )}
    </section>
  );
}
