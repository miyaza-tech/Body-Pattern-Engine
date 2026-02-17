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
        <h3>Cloud Sync</h3>
        <p className="stats-help">
          Supabase setup is required. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
          in your `.env` file.
        </p>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="record-section">
        <h3>Cloud Sync</h3>
        <p className="stats-help">Loading...</p>
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

      showToast(isSignUp ? "Sign-up complete. Check your email." : "Signed in.");
      setEmail("");
      setPassword("");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Authentication failed.");
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
      showError(err instanceof Error ? err.message : "Sign-out failed.");
    } finally {
      setSignOutLoading(false);
    }
  };

  return (
    <div className="record-section">
      <h3>Cloud Sync</h3>

      {isLoggedIn ? (
        <div className="sync-logged-in">
          <div className="sync-status-row">
            <span className="sync-status-icon">✓</span>
            <div className="sync-status-text">
              <span className="sync-email">{userEmail}</span>
            </div>
          </div>
          <div className="data-actions">
            <button type="button" onClick={onSync} className="btn-primary" disabled={syncing}>
              {syncing ? "Syncing..." : "Sync now"}
            </button>
            <button type="button" onClick={handleSignOut} className="btn-text" disabled={signOutLoading}>
              {signOutLoading ? "Working..." : "Sign out"}
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="sync-login-form">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password (6+ chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
          <div className="data-actions">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Working..." : isSignUp ? "Sign up" : "Sign in"}
            </button>
            <button
              type="button"
              onClick={() => setIsSignUp((prev) => !prev)}
              className="btn-text"
            >
              {isSignUp ? "Switch to sign in" : "Switch to sign up"}
            </button>
          </div>
        </form>
      )}

      <div className="backup-section">
        <h4>Local Backup</h4>
        <div className="data-actions">
          <button type="button" onClick={onExportData} className="btn-secondary">
            Export
          </button>
          <button type="button" onClick={onImportData} className="btn-secondary">
            Import
          </button>
        </div>
        <p className="stats-help">Back up or restore data with a JSON file.</p>
      </div>
    </div>
  );
}
