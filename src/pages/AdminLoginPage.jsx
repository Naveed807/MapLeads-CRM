import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';

export default function AdminLoginPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const { adminLogin } = useAuth();
  const navigate       = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await adminLogin(email, password);
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      if (err.message === 'Not authorized as admin') {
        setError('This account does not have admin privileges.');
      } else {
        setError(err.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-bg auth-bg-admin">
      <div className="auth-card">
        {/* Admin badge */}
        <div className="auth-admin-badge">
          <ShieldCheck size={16} />
          <span>Admin Portal</span>
        </div>

        <div className="auth-logo">
          <div className="auth-logo-icon auth-logo-icon-admin">M</div>
          <span className="auth-logo-text">MapLeads CRM</span>
        </div>

        <h1 className="auth-title">Admin sign in</h1>
        <p className="auth-subtitle">Restricted access — authorised personnel only</p>

        {error && (
          <div className="auth-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label htmlFor="email">Admin email</label>
            <div className="auth-input-wrap">
              <Mail size={16} className="auth-input-icon" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@mapleads.io"
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="password">Password</label>
            <div className="auth-input-wrap">
              <Lock size={16} className="auth-input-icon" />
              <input
                id="password"
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
              <button type="button" className="auth-pw-toggle" onClick={() => setShowPw(v => !v)}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="auth-btn-primary auth-btn-admin" disabled={loading}>
            {loading ? <><Loader2 size={16} className="spin" /> Authenticating…</> : 'Sign in as Admin'}
          </button>
        </form>

        <p className="auth-footer-text">
          <a href="/login" className="auth-link-muted">← User login</a>
        </p>
      </div>
    </div>
  );
}
