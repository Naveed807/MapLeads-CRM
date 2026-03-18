import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../services/authApi';
import { Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ResetPasswordPage() {
  const [searchParams]          = useSearchParams();
  const token                   = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [done, setDone]         = useState(false);
  const navigate                = useNavigate();

  if (!token) {
    return (
      <div className="auth-bg">
        <div className="auth-card">
          <div className="auth-error" style={{ marginTop: 0 }}>
            <AlertCircle size={16} />
            <span>Invalid or missing reset token. <Link to="/forgot-password" className="auth-link">Request a new one</Link>.</span>
          </div>
        </div>
      </div>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 8)  { setError('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      setDone(true);
      setTimeout(() => navigate('/login', { replace: true }), 3000);
    } catch (err) {
      setError(err.message || 'Reset failed. The link may have expired.');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="auth-bg">
        <div className="auth-card">
          <div className="auth-success-icon"><CheckCircle2 size={48} /></div>
          <h1 className="auth-title">Password reset!</h1>
          <p className="auth-subtitle">Your password has been updated. Redirecting you to sign in…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-bg">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">M</div>
          <span className="auth-logo-text">MapLeads CRM</span>
        </div>

        <h1 className="auth-title">Set new password</h1>
        <p className="auth-subtitle">Choose a strong password for your account.</p>

        {error && (
          <div className="auth-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label htmlFor="password">New password</label>
            <div className="auth-input-wrap">
              <Lock size={16} className="auth-input-icon" />
              <input
                id="password"
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                autoComplete="new-password"
              />
              <button type="button" className="auth-pw-toggle" onClick={() => setShowPw(v => !v)}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="confirm">Confirm new password</label>
            <div className="auth-input-wrap">
              <Lock size={16} className="auth-input-icon" />
              <input
                id="confirm"
                type={showPw ? 'text' : 'password'}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="new-password"
              />
            </div>
          </div>

          <button type="submit" className="auth-btn-primary" disabled={loading}>
            {loading ? <><Loader2 size={16} className="spin" /> Resetting…</> : 'Reset password'}
          </button>
        </form>

        <p className="auth-footer-text">
          <Link to="/login" className="auth-link">← Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
