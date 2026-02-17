import { useMemo, useState } from "react";
import type { KeywordDef, DayRecordSummary, PeriodOption } from "../types";

interface GraphTabProps {
  keywords: KeywordDef[];
  periods: PeriodOption[];
  selectedPeriodId: string;
  periodRecords: DayRecordSummary[];
  onNavigateToRecord: (day: number) => void;
  onChangePeriod: (periodId: string) => void;
  selectedPeriod: { year: number; label: string; days: number };
  onDeleteRecord: (day: number) => void;
  onMoveRecord: (fromDay: number, toDay: number) => void;
  onUpdateDays: (newDays: number) => void;
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
}: GraphTabProps) {
  const [editMode, setEditMode] = useState(false);
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [newDay, setNewDay] = useState<string>("");
  const [editingDays, setEditingDays] = useState(false);
  const [tempDays, setTempDays] = useState<string>(String(selectedPeriod.days));

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

  const handleDelete = (day: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`${day}일 기록을 삭제하시겠습니까?`)) {
      onDeleteRecord(day);
    }
  };

  const handleStartMove = (day: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingDay(day);
    setNewDay(String(day));
  };

  const handleConfirmMove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (editingDay !== null && newDay) {
      const targetDay = parseInt(newDay, 10);
      if (targetDay >= 1 && targetDay <= selectedPeriod.days && targetDay !== editingDay) {
        onMoveRecord(editingDay, targetDay);
      }
      setEditingDay(null);
      setNewDay("");
    }
  };

  const handleCancelMove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingDay(null);
    setNewDay("");
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
      <div className="section-header">
        <h2 id="graph-tab-title">월별 기록</h2>
        <button 
          className={`btn-text ${editMode ? "active" : ""}`}
          onClick={() => setEditMode(!editMode)}
        >
          {editMode ? "완료" : "편집"}
        </button>
      </div>

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
          <div className="period-title-row">
            <h3>{selectedPeriod.year}년 {selectedPeriod.label}</h3>
            {editMode ? (
              editingDays ? (
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
              )
            ) : (
              <span className="days-label">({selectedPeriod.days}일)</span>
            )}
          </div>
          <div className="month-simple-list">
            {Array.from({ length: selectedPeriod.days }, (_, i) => i + 1).map((day) => {
              const record = periodRecords.find((r) => r.day === day);
              const activeNames = record ? getActiveKeywordNames(record.values) : [];
              const memoText = record?.memo ? `(${record.memo})` : "";
              const hasRecord = activeNames.length > 0 || record?.memo;
              
              return (
                <div 
                  key={day} 
                  className={`month-simple-row ${editMode ? "edit-mode" : ""}`}
                  onClick={() => !editMode && onNavigateToRecord(day)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && !editMode && onNavigateToRecord(day)}
                >
                  {editingDay === day ? (
                    <div className="edit-day-row" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="number"
                        min={1}
                        max={selectedPeriod.days}
                        value={newDay}
                        onChange={(e) => setNewDay(e.target.value)}
                        className="day-input"
                        autoFocus
                      />
                      <span>일로 이동</span>
                      <button className="btn-sm btn-primary" onClick={handleConfirmMove}>✓</button>
                      <button className="btn-sm btn-secondary" onClick={handleCancelMove}>✕</button>
                    </div>
                  ) : (
                    <>
                      <span className="day-num">{day}일</span>
                      <span className="day-text">
                        {activeNames.length > 0 ? activeNames.join(" ") : "-"}
                        {memoText && <span className="memo-inline"> {memoText}</span>}
                      </span>
                      {editMode && hasRecord && (
                        <div className="edit-actions">
                          <button 
                            className="btn-sm btn-secondary" 
                            onClick={(e) => handleStartMove(day, e)}
                            title="날짜 이동"
                          >
                            ↔
                          </button>
                          <button 
                            className="btn-sm btn-danger" 
                            onClick={(e) => handleDelete(day, e)}
                            title="삭제"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </>
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

