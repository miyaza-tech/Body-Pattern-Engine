import { useState } from "react";
import type { KeywordDef, KeywordType, DayRecord, PeriodOption } from "../types";
import { CURRENT_YEAR } from "../constants/defaults";

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
  onAddPeriod: (year: number, label: string, days: number) => boolean;
  onDeletePeriod: (periodId: string) => boolean;
  onResetPeriods: () => void;
  selectedPeriod: PeriodOption;
  showToast: (message: string) => void;
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
  onAddPeriod,
  onDeletePeriod,
  onResetPeriods,
  selectedPeriod,
  showToast,
}: RecordTabProps) {
  const [newPeriodYear, setNewPeriodYear] = useState<number>(CURRENT_YEAR);
  const [newPeriodLabel, setNewPeriodLabel] = useState("");
  const [newPeriodDays, setNewPeriodDays] = useState("");

  const dayStatus = selectedDay <= 1 ? "D0" : `D+${selectedDay - 1}`;

  const handleAddPeriod = () => {
    const days = Math.floor(Number(newPeriodDays));
    if (onAddPeriod(newPeriodYear, newPeriodLabel, days)) {
      setNewPeriodYear(CURRENT_YEAR);
      setNewPeriodLabel("");
      setNewPeriodDays("");
      showToast("월구간이 추가되었습니다.");
    }
  };

  const handleDeletePeriod = () => {
    if (window.confirm("선택한 월구간과 해당 기록을 모두 삭제하시겠습니까?")) {
      if (onDeletePeriod(selectedPeriodId)) {
        showToast("월구간이 삭제되었습니다.");
      }
    }
  };

  return (
    <section className="card" aria-labelledby="record-tab-title">
      <h2 id="record-tab-title">날짜별 기록</h2>

      {/* 월구간 관리 */}
      <details className="record-section first collapse">
        <summary>월구간 관리</summary>
        <form
          className="period-add-row"
          onSubmit={(e) => {
            e.preventDefault();
            handleAddPeriod();
          }}
        >
          <input
            type="number"
            min={1900}
            max={2100}
            value={newPeriodYear}
            onChange={(e) => setNewPeriodYear(Number(e.target.value))}
            placeholder="연도"
            aria-label="연도"
          />
          <input
            value={newPeriodLabel}
            onChange={(e) => setNewPeriodLabel(e.target.value)}
            placeholder="예: 1~2월, 3월"
            aria-label="월구간 이름"
          />
          <input
            type="number"
            min={1}
            value={newPeriodDays}
            onChange={(e) => setNewPeriodDays(e.target.value)}
            placeholder="일수"
            aria-label="일수"
          />
          <button type="submit">구간 추가</button>
        </form>
        <div className="row-actions">
          <button onClick={onResetPeriods}>기본 구간 복원</button>
          <button onClick={handleDeletePeriod} disabled={periods.length <= 1}>
            선택 구간 삭제
          </button>
        </div>
      </details>

      {/* 날짜 네비게이션 */}
      {periods.length === 0 ? (
        <div className="empty-notice">
          <p>기록을 시작하려면 먼저 <strong>월구간을 추가</strong>하세요.</p>
          <p>위의 "월구간 관리"를 열어 연도, 월구간 이름, 일수를 입력하고 "구간 추가" 버튼을 누르세요.</p>
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
