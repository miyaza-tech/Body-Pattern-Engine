import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import "./styles/App.css";
import type { Tab, GraphMode, KeywordDef, DayRecord, PeriodOption } from "./types";
import { useKeywords, usePeriods, useRecords, useToast, useTheme, useAuth, useSync } from "./hooks";
import { KeywordTab, RecordTab, GraphTab, ChartTab, ToastContainer, SyncPanel } from "./components";
import { exportAllData, importData } from "./utils";

function App() {
  // ?뚮쭏
  const { theme, toggleTheme } = useTheme();

  // ?좎뒪??
  const { toasts, success, error, dismissToast } = useToast();

  // ?몄쬆
  const auth = useAuth();

  // ?숆린??
  const sync = useSync(auth.user?.id ?? null);
  const runSync = sync.sync;
  const autoSyncInFlightRef = useRef(false);

  // 濡쒓렇?????먮룞 ?숆린??(sessionStorage濡?臾댄븳猷⑦봽 諛⑹?)
  useEffect(() => {
    const SYNC_KEY = "bpe_synced_session";

    if (!auth.isLoggedIn) {
      sessionStorage.removeItem(SYNC_KEY);
      autoSyncInFlightRef.current = false;
      return;
    }

    if (sessionStorage.getItem(SYNC_KEY) === "true") {
      return;
    }

    if (autoSyncInFlightRef.current) {
      return;
    }

    let cancelled = false;
    const runAutoSync = async () => {
      autoSyncInFlightRef.current = true;
      const ok = await runSync();
      if (cancelled) {
        autoSyncInFlightRef.current = false;
        return;
      }

      if (ok) {
        sessionStorage.setItem(SYNC_KEY, "true");
        success("동기화 완료");
        autoSyncInFlightRef.current = false;
        setTimeout(() => window.location.reload(), 100);
        return;
      }

      sessionStorage.removeItem(SYNC_KEY);
      autoSyncInFlightRef.current = false;
    };

    void runAutoSync();
    return () => {
      cancelled = true;
    };
  }, [auth.isLoggedIn, runSync, success]);
  // ?곗씠????
  const { periods, getPeriod, addPeriod, deletePeriod, updatePeriodDays } = usePeriods();
  const { sortedRecords, getRecord, setKeywordValue, setMemo, getRecordsForPeriod, deleteRecordsForPeriod, deleteRecord, moveRecord, setRecords } = useRecords(periods);
  const { keywords, grouped, addKeyword, updateKeyword, deleteKeyword, resetToDefaults: resetKeywords, setKeywords } = useKeywords();

  // UI ?곹깭
  const [tab, setTab] = useState<Tab>("record");
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>(periods[0]?.id ?? "");
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [graphMode, setGraphMode] = useState<GraphMode>("cycle");
  const [graphKeywordId, setGraphKeywordId] = useState<string>("");
  const [syncPopupOpen, setSyncPopupOpen] = useState(false);

  // 怨꾩궛??媛?
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

  // ?좎쭨 ?대룞
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

  // ?ㅼ썙???몃뱾??
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

  // 濡쒓렇?꾩썐 ?몃뱾??(?숆린???뚮옒洹?珥덇린??
  const handleSignOut = useCallback(async () => {
    try {
      sessionStorage.removeItem("bpe_synced_session");
      await auth.signOut();
      setSyncPopupOpen(false);
      success("로그아웃되었습니다.");
    } catch (err) {
      error(err instanceof Error ? err.message : "로그아웃에 실패했습니다.");
    }
  }, [auth, success, error]);

  // 수동 동기화
  const handleManualSync = useCallback(async () => {
    sessionStorage.setItem("bpe_synced_session", "true");
    const ok = await sync.sync();
    if (ok) {
      success("동기화 완료");
      setTimeout(() => window.location.reload(), 100);
    } else {
      sessionStorage.removeItem("bpe_synced_session");
      error(sync.error || "동기화에 실패했습니다.");
    }
  }, [sync, success, error]);

  // 湲곌컙 ?몃뱾??
  const handleDeletePeriod = useCallback(
    (periodId: string) => {
      return deletePeriod(periodId, deleteRecordsForPeriod);
    },
    [deletePeriod, deleteRecordsForPeriod]
  );

  // ?곗씠??諛깆뾽/蹂듭썝
  const handleExportData = useCallback(() => {
    exportAllData();
    success("데이터를 내보냈습니다.");
  }, [success]);

  const handleImportData = useCallback(() => {
    importData(
      (data: { keywords: KeywordDef[]; records: Record<string, DayRecord>; periods: PeriodOption[] }) => {
        setKeywords(data.keywords);
        setRecords(data.records);
        // periods??usePeriods ?낆뿉??rehydrate ?꾩슂
        window.location.reload();
      },
      (message: string) => {
        error(message);
      }
    );
  }, [setKeywords, setRecords, error]);

  // 洹몃옒????뿉??湲곕줉?쇰줈 ?대룞
  const navigateToRecord = useCallback((day: number) => {
    setTab("record");
    setSelectedDay(day);
  }, []);

  return (
    <div className="mobile-shell">
      {/* ?ㅻ뜑 */}
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
          통계
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

      {/* 硫붿씤 肄섑뀗痢?*/}
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
            selectedPeriod={selectedPeriod}
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
            onDeletePeriod={() => handleDeletePeriod(activeSelectedPeriodId)}
            onAddPeriod={addPeriod}
          />
        )}

        {tab === "chart" && (
          <ChartTab
            keywords={keywords}
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

      {/* ?숆린???앹뾽 */}
      {syncPopupOpen && (
        <div className="popup-overlay" onClick={() => setSyncPopupOpen(false)}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <button className="popup-close" onClick={() => setSyncPopupOpen(false)}>×</button>
            <SyncPanel
              isLoggedIn={auth.isLoggedIn}
              userEmail={auth.user?.email ?? null}
              configured={auth.configured}
              authLoading={auth.loading}
              syncing={sync.syncing}
              onSignIn={auth.signIn}
              onSignUp={auth.signUp}
              onSignOut={handleSignOut}
              onSync={handleManualSync}
              showToast={success}
              showError={error}
              onExportData={handleExportData}
              onImportData={handleImportData}
            />
          </div>
        </div>
      )}

      {/* ?좎뒪???뚮┝ */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default App;



