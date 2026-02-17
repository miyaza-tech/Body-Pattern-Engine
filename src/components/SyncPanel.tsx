import { useState } from "react";

interface SyncPanelProps {
  // Auth
  isLoggedIn: boolean;
  userEmail: string | null;
  configured: boolean;
  authLoading: boolean;
  onSignIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  onSignUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  onSignOut: () => Promise<void>;
  // Sync
  syncing: boolean;
  lastSync: Date | null;
  syncError: string | null;
  onUpload: () => Promise<boolean>;
  onDownload: () => Promise<boolean>;
  onSync: () => Promise<boolean>;
  // Toast
  showToast: (message: string) => void;
  showError: (message: string) => void;
  // Data backup
  onExportData: () => void;
  onImportData: () => void;
}

export function SyncPanel({
  isLoggedIn,
  userEmail,
  configured,
  authLoading,
  onSignIn,
  onSignUp,
  onSignOut,
  syncing,
  lastSync,
  syncError,
  onUpload,
  onDownload,
  onSync,
  showToast,
  showError,
  onExportData,
  onImportData,
}: SyncPanelProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!configured) {
    return (
      <div className="record-section">
        <h3>클라우드 동기화</h3>
        <p className="stats-help">
          Supabase 설정이 필요합니다. .env 파일에 VITE_SUPABASE_URL과 VITE_SUPABASE_ANON_KEY를 설정하세요.
        </p>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="record-section">
        <h3>클라우드 동기화</h3>
        <p className="stats-help">로딩 중...</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    const { error } = isSignUp
      ? await onSignUp(email, password)
      : await onSignIn(email, password);

    if (error) {
      showError(error.message);
    } else {
      showToast(isSignUp ? "회원가입 완료. 이메일을 확인하세요." : "로그인 성공");
      setEmail("");
      setPassword("");
    }
    setLoading(false);
  };

  const handleSync = async () => {
    const ok = await onSync();
    if (ok) {
      showToast("동기화 완료");
      // 페이지 새로고침으로 데이터 반영
      window.location.reload();
    } else if (syncError) {
      showError(syncError);
    }
  };

  const handleUpload = async () => {
    const ok = await onUpload();
    if (ok) {
      showToast("클라우드에 업로드 완료");
    } else if (syncError) {
      showError(syncError);
    }
  };

  const handleDownload = async () => {
    if (!window.confirm("클라우드 데이터로 덮어쓰시겠습니까? 현재 기기의 데이터는 사라집니다.")) {
      return;
    }
    const ok = await onDownload();
    if (ok) {
      showToast("다운로드 완료");
      window.location.reload();
    } else if (syncError) {
      showError(syncError);
    }
  };

  const formatLastSync = (date: Date | null) => {
    if (!date) return "없음";
    return date.toLocaleString("ko-KR");
  };

  return (
    <div className="record-section">
      <h3>클라우드 동기화</h3>

      {isLoggedIn ? (
        <>
          <div className="sync-user-info">
            <span>{userEmail}</span>
            <button onClick={onSignOut} className="btn-text">
              로그아웃
            </button>
          </div>
          <div className="sync-status">
            <span>마지막 동기화: {formatLastSync(lastSync)}</span>
          </div>
          <div className="data-actions">
            <button onClick={handleSync} disabled={syncing} className="btn-primary">
              {syncing ? "동기화 중..." : "동기화"}
            </button>
            <button onClick={handleUpload} disabled={syncing} className="btn-secondary">
              업로드
            </button>
            <button onClick={handleDownload} disabled={syncing} className="btn-secondary">
              다운로드
            </button>
          </div>
          <p className="stats-help">
            동기화: 최신 데이터 자동 선택 | 업로드: 이 기기 → 클라우드 | 다운로드: 클라우드 → 이 기기
          </p>
        </>
      ) : (
        <form onSubmit={handleSubmit} className="sync-login-form">
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="비밀번호 (6자 이상)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
          <div className="data-actions">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "처리 중..." : isSignUp ? "회원가입" : "로그인"}
            </button>
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="btn-text"
            >
              {isSignUp ? "로그인으로" : "회원가입으로"}
            </button>
          </div>
        </form>
      )}

      {/* 로컬 데이터 백업 */}
      <div className="backup-section">
        <h4>로컬 백업</h4>
        <div className="data-actions">
          <button onClick={onExportData} className="btn-secondary">
            📁 내보내기
          </button>
          <button onClick={onImportData} className="btn-secondary">
            📂 가져오기
          </button>
        </div>
        <p className="stats-help">
          JSON 파일로 데이터를 백업하거나 복원합니다.
        </p>
      </div>
    </div>
  );
}
