import { useState } from "react";
import type { FormEvent } from "react";

interface SyncPanelProps {
  isLoggedIn: boolean;
  userEmail: string | null;
  configured: boolean;
  authLoading: boolean;
  syncing: boolean;
  onSignIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  onSignUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  onSignOut: () => Promise<void>;
  onSync: () => Promise<void>;
  onUpload: () => Promise<void>;
  onDownload: () => Promise<void>;
  showToast: (message: string) => void;
  showError: (message: string) => void;
  onExportData: () => void;
  onImportData: () => void;
}

export function SyncPanel({
  isLoggedIn,
  userEmail,
  configured,
  authLoading,
  syncing,
  onSignIn,
  onSignUp,
  onSignOut,
  onSync,
  onUpload,
  onDownload,
  showToast,
  showError,
  onExportData,
  onImportData,
}: SyncPanelProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [signOutLoading, setSignOutLoading] = useState(false);

  if (!configured) {
    return (
      <div className="record-section">
        <h3>클라우드 동기화</h3>
        <p className="stats-help">
          Supabase 설정이 필요합니다.
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    try {
      const { error } = isSignUp
        ? await onSignUp(email, password)
        : await onSignIn(email, password);

      if (error) {
        // 에러 메시지 추상화 (상세 정보는 콘솔에만)
        console.error("Auth error:", error.message);
        const userMessage = error.message.includes("Invalid login")
          ? "이메일 또는 비밀번호가 올바르지 않습니다."
          : error.message.includes("already registered")
          ? "이미 등록된 이메일입니다."
          : isSignUp ? "회원가입에 실패했습니다." : "로그인에 실패했습니다.";
        showError(userMessage);
        return;
      }

      showToast(isSignUp ? "회원가입 완료. 이메일을 확인하세요." : "로그인 성공");
      setEmail("");
      setPassword("");
    } catch (err) {
      console.error("Auth exception:", err);
      showError(isSignUp ? "회원가입에 실패했습니다." : "로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (signOutLoading) return;
    setSignOutLoading(true);
    try {
      await onSignOut();
    } catch (err) {
      showError(err instanceof Error ? err.message : "로그아웃 실패");
    } finally {
      setSignOutLoading(false);
    }
  };

  return (
    <div className="sync-panel">
      <div className="sync-section">
        <h3 className="sync-section-title">클라우드 동기화</h3>

        {isLoggedIn ? (
          <div className="sync-logged-in">
            <div className="sync-user-badge">
              <span className="sync-user-icon">✓</span>
              <span className="sync-user-email">{userEmail}</span>
            </div>
            <div className="sync-buttons-grid">
              <button type="button" onClick={onSync} className="btn-sync-main" disabled={syncing}>
                {syncing ? "동기화 중..." : "⟳ 동기화"}
              </button>
            </div>
            <div className="sync-buttons-row">
              <button type="button" onClick={onUpload} className="btn-sync-sub" disabled={syncing}>
                ↑ 업로드
              </button>
              <button type="button" onClick={onDownload} className="btn-sync-sub" disabled={syncing}>
                ↓ 다운로드
              </button>
            </div>
            <div className="sync-buttons-row">
              <button type="button" onClick={onExportData} className="btn-sync-sub">
                내보내기
              </button>
              <button type="button" onClick={onImportData} className="btn-sync-sub">
                가져오기
              </button>
            </div>
            <button type="button" onClick={handleSignOut} className="btn-logout" disabled={signOutLoading}>
              {signOutLoading ? "..." : "로그아웃"}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="sync-form">
            <input
              type="email"
              placeholder="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="sync-input"
              required
            />
            <input
              type="password"
              placeholder="비밀번호 (6자 이상)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="sync-input"
              minLength={6}
              required
            />
            <div className="sync-form-actions">
              <button type="submit" disabled={loading} className="btn-sync-main">
                {loading ? "..." : isSignUp ? "회원가입" : "로그인"}
              </button>
              <button
                type="button"
                onClick={() => setIsSignUp((prev) => !prev)}
                className="btn-switch"
              >
                {isSignUp ? "로그인으로" : "회원가입으로"}
              </button>
            </div>
          </form>
        )}
      </div>

      {!isLoggedIn && (
        <div className="sync-section sync-section-secondary">
          <h3 className="sync-section-title">로컬 백업</h3>
          <p className="sync-help-text">로그인 없이 데이터를 파일로 백업하세요.</p>
          <div className="sync-buttons-row">
            <button type="button" onClick={onExportData} className="btn-sync-sub">
              내보내기
            </button>
            <button type="button" onClick={onImportData} className="btn-sync-sub">
              가져오기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
