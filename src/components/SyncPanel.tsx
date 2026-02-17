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
        showError(error.message);
        return;
      }

      showToast(isSignUp ? "회원가입 완료. 이메일을 확인하세요." : "로그인 성공");
      setEmail("");
      setPassword("");
    } catch (err) {
      showError(err instanceof Error ? err.message : "인증 실패");
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
    <div className="record-section">
      <h3>클라우드 동기화</h3>

      {isLoggedIn ? (
        <div className="sync-logged-in">
          <div className="sync-status-row">
            <span className="sync-status-icon">✓</span>
            <span className="sync-email">{userEmail}</span>
          </div>
          <div className="data-actions">
            <button type="button" onClick={onSync} className="btn-primary" disabled={syncing}>
              {syncing ? "..." : "동기화"}
            </button>
            <button type="button" onClick={onUpload} className="btn-secondary" disabled={syncing}>
              ↑ 업로드
            </button>
            <button type="button" onClick={onDownload} className="btn-secondary" disabled={syncing}>
              ↓ 다운로드
            </button>
          </div>
          <div className="data-actions">
            <button type="button" onClick={onExportData} className="btn-secondary">
              내보내기
            </button>
            <button type="button" onClick={onImportData} className="btn-secondary">
              가져오기
            </button>
            <button type="button" onClick={handleSignOut} className="btn-text" disabled={signOutLoading}>
              {signOutLoading ? "..." : "로그아웃"}
            </button>
          </div>
        </div>
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
              {loading ? "..." : isSignUp ? "회원가입" : "로그인"}
            </button>
            <button
              type="button"
              onClick={() => setIsSignUp((prev) => !prev)}
              className="btn-text"
            >
              {isSignUp ? "로그인으로" : "회원가입으로"}
            </button>
          </div>
        </form>
      )}

      {!isLoggedIn && (
        <div className="backup-section">
          <h4>로컬 백업</h4>
          <div className="data-actions">
            <button type="button" onClick={onExportData} className="btn-secondary">
              내보내기
            </button>
            <button type="button" onClick={onImportData} className="btn-secondary">
              가져오기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
