import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import "./styles/App.css";
import type { Tab, GraphMode, KeywordDef, DayRecord, PeriodOption } from "./types";
import { useKeywords, usePeriods, useRecords, useToast, useTheme, useCyclePrediction, useAuth, useSync } from "./hooks";
import { KeywordTab, RecordTab, GraphTab, ChartTab, ToastContainer, SyncPanel } from "./components";
import { exportAllData, importData } from "./utils";

function App() {
  // 테마
  const { theme, toggleTheme } = useTheme();

  // 토스트
  const { toasts, success, error, dismissToast } = useToast();

  // 인증
  const auth = useAuth();

  // 동기화
  const sync = useSync(auth.user?.id ?? null);

  // 자동 동기화 (로그인 시) - sessionStorage로 세션 중 1회만 실행
  const hasAutoSynced = useRef(false);
  useEffect(() => {
    const syncKey = `bpe_auto_synced_${auth.user?.id}`;
    const alreadySynced = sessionStorage.getItem(syncKey);
    
    if (auth.isLoggedIn && !auth.loading && !hasAutoSynced.current && !alreadySynced) {
      hasAutoSynced.current = true;
      sessionStorage.setItem(syncKey, "true");
      sync.sync().then((ok) => {
        if (ok) {
          window.location.reload();
        }
      });
    }
    if (!auth.isLoggedIn) {
      hasAutoSynced.current = false;
    }
  }, [auth.isLoggedIn, auth.loading, auth.user?.id]);

  // 데이터 훅
  const { periods, getPeriod, addPeriod, deletePeriod, updatePeriodDays, resetToDefaults: resetPeriods } = usePeriods();
  const { sortedRecords, getRecord, setKeywordValue, setMemo, getRecordsForPeriod, deleteRecordsForPeriod, deleteRecord, moveRecord, setRecords } = useRecords(periods);
  const { keywords, grouped, scaleKeywords, addKeyword, updateKeyword, deleteKeyword, resetToDefaults: resetKeywords, setKeywords } = useKeywords();

  // 주기 예측
  const prediction = useCyclePrediction(sortedRecords);

  // UI 상태
  const [tab, setTab] = useState<Tab>("record");
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>(periods[0]?.id ?? "");
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [graphMode, setGraphMode] = useState<GraphMode>("cycle");
  const [graphKeywordId, setGraphKeywordId] = useState<string>("");
  const [syncPopupOpen, setSyncPopupOpen] = useState(false);

  // 계산된 값
  const activeSelectedPeriodId = useMemo(() => {
    if (!periods.length) return "";
    return periods.some((p) => p.id === selectedPeriodId) ? selectedPeriodId : periods[0].id;
  }, [periods, selectedPeriodId]);

  const selectedPeriod = useMemo(() => getPeriod(activeSelectedPeriodId), [getPeriod, activeSelectedPeriodId]);

  const activeSelectedDay = useMemo(
    () => Math.max(1, Math.min(selectedDay, selectedPeriod.days)),
    [selectedDay, selectedPeriod.days]
  );

  const currentRecord = useMemo(
    () => getRecord(activeSelectedPeriodId, activeSelectedDay),
    [getRecord, activeSelectedPeriodId, activeSelectedDay]
  );

  const periodRecords = useMemo(
    () => getRecordsForPeriod(activeSelectedPeriodId),
    [getRecordsForPeriod, activeSelectedPeriodId]
  );

  // 날짜 이동
  const onChangePeriod = useCallback(
    (nextPeriodId: string) => {
      const nextPeriod = getPeriod(nextPeriodId);
      setSelectedPeriodId(nextPeriodId);
      setSelectedDay((prev) => Math.min(prev, nextPeriod.days));
    },
    [getPeriod]
  );

  const goPrevDay = useCallback(() => {
    if (activeSelectedDay > 1) {
      setSelectedDay((d) => d - 1);
      return;
    }

    const currentIdx = periods.findIndex((p) => p.id === activeSelectedPeriodId);
    if (currentIdx <= 0) return;
    const prevPeriod = periods[currentIdx - 1];
    setSelectedPeriodId(prevPeriod.id);
    setSelectedDay(prevPeriod.days);
  }, [activeSelectedDay, activeSelectedPeriodId, periods]);

  const goNextDay = useCallback(() => {
    if (activeSelectedDay < selectedPeriod.days) {
      setSelectedDay((d) => d + 1);
      return;
    }

    const currentIdx = periods.findIndex((p) => p.id === activeSelectedPeriodId);
    if (currentIdx >= periods.length - 1) return;
    const nextPeriod = periods[currentIdx + 1];
    setSelectedPeriodId(nextPeriod.id);
    setSelectedDay(1);
  }, [activeSelectedDay, activeSelectedPeriodId, periods, selectedPeriod.days]);

  // 키워드 핸들러
  const handleDeleteKeyword = useCallback(
    (id: string) => {
      deleteKeyword(id, setRecords);
    },
    [deleteKeyword, setRecords]
  );

  const handleSetKeywordValue = useCallback(
    (keyword: KeywordDef, value: number | boolean) => {
      setKeywordValue(activeSelectedPeriodId, activeSelectedDay, keyword, value);
    },
    [setKeywordValue, activeSelectedPeriodId, activeSelectedDay]
  );

  const handleSetMemo = useCallback(
    (memo: string) => {
      setMemo(activeSelectedPeriodId, activeSelectedDay, memo);
    },
    [setMemo, activeSelectedPeriodId, activeSelectedDay]
  );

  // 기간 핸들러
  const handleDeletePeriod = useCallback(
    (periodId: string) => {
      return deletePeriod(periodId, deleteRecordsForPeriod);
    },
    [deletePeriod, deleteRecordsForPeriod]
  );

  // 데이터 백업/복원
  const handleExportData = useCallback(() => {
    exportAllData();
    success("데이터가 내보내기되었습니다.");
  }, [success]);

  const handleImportData = useCallback(() => {
    importData(
      (data: { keywords: KeywordDef[]; records: Record<string, DayRecord>; periods: PeriodOption[] }) => {
        setKeywords(data.keywords);
        setRecords(data.records);
        // periods는 usePeriods 훅에서 rehydrate 필요
        window.location.reload();
      },
      (message: string) => {
        error(message);
      }
    );
  }, [setKeywords, setRecords, error]);

  // 그래프 탭에서 기록으로 이동
  const navigateToRecord = useCallback((day: number) => {
    setTab("record");
    setSelectedDay(day);
  }, []);

  return (
    <div className="mobile-shell">
      {/* 헤더 */}
      <header className="top-tabs">
        <button
          className={tab === "keywords" ? "active" : ""}
          onClick={() => setTab("keywords")}
          aria-selected={tab === "keywords"}
        >
          키워드
        </button>
        <button
          className={tab === "record" ? "active" : ""}
          onClick={() => setTab("record")}
          aria-selected={tab === "record"}
        >
          기록
        </button>
        <button
          className={tab === "graph" ? "active" : ""}
          onClick={() => setTab("graph")}
          aria-selected={tab === "graph"}
        >
          월별
        </button>
        <button
          className={tab === "chart" ? "active" : ""}
          onClick={() => setTab("chart")}
          aria-selected={tab === "chart"}
        >
          그래프
        </button>
        <div className="header-actions">
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={theme === "light" ? "다크 모드로 전환" : "라이트 모드로 전환"}
            title={theme === "light" ? "다크 모드" : "라이트 모드"}
          >
            {theme === "light" ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5"/>
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
              </svg>
            )}
          </button>
          <button
            className="sync-toggle"
            onClick={() => setSyncPopupOpen(true)}
            aria-label="설정"
            title="설정"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="content">
        {tab === "keywords" && (
          <KeywordTab
            keywords={keywords}
            grouped={grouped}
            onAddKeyword={addKeyword}
            onUpdateKeyword={updateKeyword}
            onDeleteKeyword={handleDeleteKeyword}
            onResetDefaults={resetKeywords}
            showToast={success}
          />
        )}

        {tab === "record" && (
          <RecordTab
            periods={periods}
            selectedPeriodId={activeSelectedPeriodId}
            selectedDay={activeSelectedDay}
            currentRecord={currentRecord}
            grouped={grouped}
            onChangePeriod={onChangePeriod}
            onChangeDay={setSelectedDay}
            onPrevDay={goPrevDay}
            onNextDay={goNextDay}
            onSetKeywordValue={handleSetKeywordValue}
            onSetMemo={handleSetMemo}
            onAddPeriod={addPeriod}
            onDeletePeriod={handleDeletePeriod}
            onResetPeriods={resetPeriods}
            selectedPeriod={selectedPeriod}
            showToast={success}
          />
        )}

        {tab === "graph" && (
          <GraphTab
            keywords={keywords}
            periods={periods}
            selectedPeriodId={activeSelectedPeriodId}
            periodRecords={periodRecords}
            onNavigateToRecord={navigateToRecord}
            onChangePeriod={onChangePeriod}
            selectedPeriod={selectedPeriod}
            onDeleteRecord={(day) => deleteRecord(activeSelectedPeriodId, day)}
            onMoveRecord={(fromDay, toDay) => moveRecord(activeSelectedPeriodId, fromDay, toDay)}
            onUpdateDays={(newDays) => updatePeriodDays(activeSelectedPeriodId, newDays)}
          />
        )}

        {tab === "chart" && (
          <ChartTab
            scaleKeywords={scaleKeywords}
            sortedRecords={sortedRecords}
            periods={periods}
            selectedPeriodId={activeSelectedPeriodId}
            graphMode={graphMode}
            graphKeywordId={graphKeywordId}
            onSetGraphMode={setGraphMode}
            onSetGraphKeywordId={setGraphKeywordId}
            onChangePeriod={onChangePeriod}
          />
        )}

      </main>

      {/* 동기화 팝업 */}
      {syncPopupOpen && (
        <div className="popup-overlay" onClick={() => setSyncPopupOpen(false)}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <button className="popup-close" onClick={() => setSyncPopupOpen(false)}>×</button>
            <SyncPanel
              isLoggedIn={auth.isLoggedIn}
              userEmail={auth.user?.email ?? null}
              configured={auth.configured}
              authLoading={auth.loading}
              onSignIn={auth.signIn}
              onSignUp={auth.signUp}
              onSignOut={auth.signOut}
              syncing={sync.syncing}
              lastSync={sync.lastSync}
              syncError={sync.error}
              onUpload={sync.upload}
              onDownload={sync.download}
              onSync={sync.sync}
              showToast={success}
              showError={error}
              onExportData={handleExportData}
              onImportData={handleImportData}
            />
          </div>
        </div>
      )}

      {/* 토스트 알림 */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default App;
