import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../services/authApi';
import { Mail, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [sent, setSent]       = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="auth-bg">
        <div className="auth-card">
          <div className="auth-logo">
            <div className="auth-logo-icon">M</div>
            <span className="auth-logo-text">MapLeads CRM</span>
          </div>
          <div className="auth-success-icon">
            <CheckCircle2 size={48} />
          </div>
          <h1 className="auth-title">Check your email</h1>
          <p className="auth-subtitle">
            If <strong>{email}</strong> is registered, we've sent a password reset link.
            Check your spam folder if you don't see it.
          </p>
          <Link to="/login" className="auth-btn-primary" style={{ display: 'block', textAlign: 'center', marginTop: 24 }}>
            Back to sign in
          </Link>
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

        <h1 className="auth-title">Forgot your password?</h1>
        <p className="auth-subtitle">Enter your email and we'll send you a reset link.</p>

        {error && (
          <div className="auth-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label htmlFor="email">Email address</label>
            <div className="auth-input-wrap">
              <Mail size={16} className="auth-input-icon" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>
          </div>

          <button type="submit" className="auth-btn-primary" disabled={loading}>
            {loading ? <><Loader2 size={16} className="spin" /> Sending…</> : 'Send reset link'}
          </button>
        </form>

        <p className="auth-footer-text">
          <Link to="/login" className="auth-link">← Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
