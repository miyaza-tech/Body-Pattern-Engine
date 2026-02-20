import { useMemo, useState } from "react";
import type { KeywordDef, DayRecordSummary, PeriodOption } from "../types";
import { CURRENT_YEAR } from "../constants/defaults";

const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

interface GraphTabProps {
  keywords: KeywordDef[];
  periods: PeriodOption[];
  selectedPeriodId: string;
  periodRecords: DayRecordSummary[];
  onNavigateToRecord: (day: number) => void;
  onChangePeriod: (periodId: string) => void;
  selectedPeriod: { year: number; label: string; days: number; startDayOfWeek?: number };
  onDeleteRecord: (day: number) => void;
  onMoveRecord: (fromDay: number, toDay: number) => void;
  onUpdateDays: (newDays: number) => void;
  onDeletePeriod: () => void;
  onAddPeriod: (year: number, label: string, days: number, startDayOfWeek?: number) => boolean;
}

export function GraphTab({
  keywords,
  periods,
  selectedPeriodId,
  periodRecords,
  onNavigateToRecord,
  onChangePeriod,
  selectedPeriod,
  onDeleteRecord,
  onMoveRecord,
  onUpdateDays,
  onDeletePeriod,
  onAddPeriod,
}: GraphTabProps) {
  // 선택된 행 (클릭 시 액션 메뉴 표시)
  const [selectedRowDay, setSelectedRowDay] = useState<number | null>(null);
  const [movingDay, setMovingDay] = useState<number | null>(null);
  const [editingDays, setEditingDays] = useState(false);
  const [tempDays, setTempDays] = useState<string>(String(selectedPeriod.days));
  const [showAddPeriod, setShowAddPeriod] = useState(false);
  const [showOnlyRecords, setShowOnlyRecords] = useState(false);

  // 월구간 추가 폼 상태
  const [newPeriodYear, setNewPeriodYear] = useState<number>(CURRENT_YEAR);
  const [newPeriodLabel, setNewPeriodLabel] = useState("");
  const [newPeriodDays, setNewPeriodDays] = useState("");
  const [newPeriodStartDay, setNewPeriodStartDay] = useState<number | undefined>(undefined);

  // 날짜에 해당하는 요일 계산
  const getDayOfWeekName = (day: number): string | null => {
    if (selectedPeriod.startDayOfWeek === undefined) return null;
    const dow = (selectedPeriod.startDayOfWeek + day - 1) % 7;
    return DAY_NAMES[dow];
  };

  const handleAddPeriod = () => {
    const days = Math.floor(Number(newPeriodDays));
    if (onAddPeriod(newPeriodYear, newPeriodLabel, days, newPeriodStartDay)) {
      setNewPeriodYear(CURRENT_YEAR);
      setNewPeriodLabel("");
      setNewPeriodDays("");
      setNewPeriodStartDay(undefined);
      setShowAddPeriod(false);
    }
  };

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

  const handleRowClick = (day: number) => {
    if (movingDay !== null) {
      // 이동 모드일 때는 대상 날짜 선택
      if (movingDay !== day) {
        onMoveRecord(movingDay, day);
      }
      setMovingDay(null);
      setSelectedRowDay(null);
      return;
    }
    
    // 일반 클릭: 토글
    if (selectedRowDay === day) {
      setSelectedRowDay(null);
    } else {
      setSelectedRowDay(day);
    }
  };

  const handleDelete = (day: number) => {
    if (window.confirm(`${day}일 기록을 삭제하시겠습니까?`)) {
      onDeleteRecord(day);
      setSelectedRowDay(null);
    }
  };

  const handleStartMove = (day: number) => {
    setMovingDay(day);
    setSelectedRowDay(null);
  };

  const handleCancelMove = () => {
    setMovingDay(null);
  };

  const handleStartEditDays = () => {
    setEditingDays(true);
    setTempDays(String(selectedPeriod.days));
  };

  const handleConfirmDays = () => {
    const newDays = parseInt(tempDays, 10);
    if (newDays >= 1 && newDays <= 50) {
      onUpdateDays(newDays);
    }
    setEditingDays(false);
  };

  const handleCancelDays = () => {
    setEditingDays(false);
    setTempDays(String(selectedPeriod.days));
  };

  return (
    <section className="card" aria-labelledby="graph-tab-title">
      <h2 id="graph-tab-title">월별 기록</h2>

      {/* 이동 모드 안내 */}
      {movingDay !== null && (
        <div className="move-mode-help">
          <span>{movingDay}일 기록을 이동할 날짜를 선택하세요</span>
          <button className="btn-sm btn-secondary" onClick={handleCancelMove}>취소</button>
        </div>
      )}

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
          <button 
            className="btn-sm btn-secondary"
            onClick={() => setShowAddPeriod(!showAddPeriod)}
          >
            {showAddPeriod ? "취소" : "+ 추가"}
          </button>
          {periods.length > 1 && (
            <button 
              className="btn-sm btn-danger"
              onClick={() => {
                if (window.confirm(`"${selectedPeriod.year}년 ${selectedPeriod.label}" 월구간을 삭제하시겠습니까?`)) {
                  onDeletePeriod();
                }
              }}
            >
              삭제
            </button>
          )}
        </div>
      )}

      {/* 월구간 추가 폼 */}
      {(showAddPeriod || periods.length === 0) && (
        <div className="period-add-section">
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
            <select
              value={newPeriodStartDay ?? ""}
              onChange={(e) => setNewPeriodStartDay(e.target.value ? Number(e.target.value) : undefined)}
              aria-label="시작 요일"
            >
              <option value="">요일 없음</option>
              <option value="0">일요일</option>
              <option value="1">월요일</option>
              <option value="2">화요일</option>
              <option value="3">수요일</option>
              <option value="4">목요일</option>
              <option value="5">금요일</option>
              <option value="6">토요일</option>
            </select>
            <button type="submit">추가</button>
          </form>
        </div>
      )}

      {/* 선택 월구간 기록 - 바로 표시 */}
      {periods.length > 0 && (
        <div className="record-section">
          <div className="period-title-row">
            <h3>{selectedPeriod.year}년 {selectedPeriod.label}</h3>
            <div className="period-title-actions">
              <button 
                className={`btn-sm ${showOnlyRecords ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setShowOnlyRecords(!showOnlyRecords)}
              >
                {showOnlyRecords ? '기록만' : '전체'}
              </button>
              {editingDays ? (
              <div className="days-edit-row">
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={tempDays}
                  onChange={(e) => setTempDays(e.target.value)}
                  className="day-input"
                  autoFocus
                />
                <span>일</span>
                <button className="btn-sm btn-primary" onClick={handleConfirmDays}>✓</button>
                <button className="btn-sm btn-secondary" onClick={handleCancelDays}>✕</button>
              </div>
            ) : (
              <button className="btn-text days-btn" onClick={handleStartEditDays}>
                {selectedPeriod.days}일 ✎
              </button>
            )}
            </div>
          </div>
          
          <div className="month-simple-list">
            {Array.from({ length: selectedPeriod.days }, (_, i) => i + 1)
              .filter((day) => {
                if (!showOnlyRecords) return true;
                const record = periodRecords.find((r) => r.day === day);
                if (!record) return false;
                
                // 기록만 보기
                const activeNames = getActiveKeywordNames(record.values);
                return activeNames.length > 0 || record?.memo;
              })
              .map((day) => {
              const record = periodRecords.find((r) => r.day === day);
              const activeNames = record ? getActiveKeywordNames(record.values) : [];
              const memoText = record?.memo ? `(${record.memo})` : "";
              const hasRecord = !!(activeNames.length > 0 || record?.memo);
              const isSelected = selectedRowDay === day;
              const isMovingTarget = movingDay !== null && movingDay !== day;
              
              return (
                <div 
                  key={day} 
                  className={`month-simple-row ${isSelected ? "selected" : ""} ${isMovingTarget ? "move-target" : ""}`}
                  onClick={() => handleRowClick(day)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && handleRowClick(day)}
                >
                  <span className="day-num">
                    {day}일{getDayOfWeekName(day) && <span className="day-of-week">({getDayOfWeekName(day)})</span>}
                  </span>
                  <span className="day-text">
                    {activeNames.length > 0 ? activeNames.join(" ") : "-"}
                    {memoText && <span className="memo-inline"> {memoText}</span>}
                  </span>
                  
                  {/* 선택된 행에 액션 버튼 표시 */}
                  {isSelected && (
                    <div className="row-actions-inline">
                      <button 
                        className="btn-sm btn-primary" 
                        onClick={(e) => { e.stopPropagation(); onNavigateToRecord(day); }}
                      >
                        기록
                      </button>
                      {hasRecord && (
                        <>
                          <button 
                            className="btn-sm btn-secondary" 
                            onClick={(e) => { e.stopPropagation(); handleStartMove(day); }}
                          >
                            이동
                          </button>
                          <button 
                            className="btn-sm btn-danger" 
                            onClick={(e) => { e.stopPropagation(); handleDelete(day); }}
                          >
                            삭제
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}