import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, Building2, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

function PasswordStrength({ password }) {
  const checks = [
    { label: 'At least 8 characters', ok: password.length >= 8 },
    { label: 'Contains a number',     ok: /\d/.test(password) },
    { label: 'Contains uppercase',    ok: /[A-Z]/.test(password) },
  ];
  if (!password) return null;
  return (
    <ul className="pw-strength">
      {checks.map(c => (
        <li key={c.label} className={c.ok ? 'ok' : 'fail'}>
          {c.ok ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
          <span>{c.label}</span>
        </li>
      ))}
    </ul>
  );
}

export default function RegisterPage() {
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [orgName, setOrgName]   = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading]   = useState(false);

  const { register } = useAuth();
  const navigate     = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setLoading(true);
    try {
      await register(name, email, password, orgName || undefined);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      if (err.details) setFieldErrors(err.details);
      else setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-bg">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">M</div>
          <span className="auth-logo-text">MapLeads CRM</span>
        </div>

        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Start managing your leads today</p>

        {error && (
          <div className="auth-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label htmlFor="name">Full name</label>
            <div className="auth-input-wrap">
              <User size={16} className="auth-input-icon" />
              <input
                id="name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="John Smith"
                required
              />
            </div>
            {fieldErrors.name && <p className="field-error">{fieldErrors.name[0]}</p>}
          </div>

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
            {fieldErrors.email && <p className="field-error">{fieldErrors.email[0]}</p>}
          </div>

          <div className="auth-field">
            <label htmlFor="orgName">Organization name <span className="optional">(optional)</span></label>
            <div className="auth-input-wrap">
              <Building2 size={16} className="auth-input-icon" />
              <input
                id="orgName"
                type="text"
                value={orgName}
                onChange={e => setOrgName(e.target.value)}
                placeholder="Acme Corp"
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
                minLength={8}
                autoComplete="new-password"
              />
              <button type="button" className="auth-pw-toggle" onClick={() => setShowPw(v => !v)}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <PasswordStrength password={password} />
            {fieldErrors.password && <p className="field-error">{fieldErrors.password[0]}</p>}
          </div>

          <button type="submit" className="auth-btn-primary" disabled={loading}>
            {loading ? <><Loader2 size={16} className="spin" /> Creating account…</> : 'Create account'}
          </button>
        </form>

        <p className="auth-footer-text">
          Already have an account?{' '}
          <Link to="/login" className="auth-link">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
