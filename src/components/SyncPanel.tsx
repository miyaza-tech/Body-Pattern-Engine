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

  return (
    <div className="record-section">
      <h3>클라우드 동기화</h3>

      {isLoggedIn ? (
        <>
          <div className="sync-logged-in">
            <div className="sync-status-row">
              <span className="sync-status-icon">✓</span>
              <div className="sync-status-text">
                <span className="sync-email">{userEmail}</span>
                <span className="sync-auto-msg">자동 동기화 활성화됨</span>
              </div>
            </div>
            <button onClick={onSignOut} className="btn-text">
              로그아웃
            </button>
          </div>
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
