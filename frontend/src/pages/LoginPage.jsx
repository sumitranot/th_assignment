import React, { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export const LoginPage = () => {
  const { isAuthenticated, user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [errorBanner, setErrorBanner] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already logged in, redirect to respective role dashboard
  if (isAuthenticated && user) {
    const fromPath = location.state?.from?.pathname;
    if (fromPath && fromPath !== '/login') {
      return <Navigate to={fromPath} replace />;
    }
    return <Navigate to={user.role === 'reviewer' ? '/review' : '/submit'} replace />;
  }

  const validateForm = () => {
    const newErrors = {};
    if (!username.trim()) {
      newErrors.username = 'Username is required';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setErrorBanner('');

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const data = await login({ username: username.trim(), password });
      const targetPath = data.user.role === 'reviewer' ? '/review' : '/submit';
      navigate(targetPath, { replace: true });
    } catch (err) {
      setErrorBanner(err.message || 'Login failed. Please check your credentials.');
      if (err.details) {
        setErrors(err.details);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillCredentials = (demoUsername, demoRole) => {
    setUsername(demoUsername);
    setPassword('Passw0rd!demo');
    setErrors({});
    setErrorBanner('');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-bg)',
        padding: 'var(--space-4)',
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: '440px',
          width: '100%',
          boxShadow: 'var(--shadow-xl)',
          padding: 'var(--space-8)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              margin: '0 auto var(--space-3)',
              backgroundColor: 'var(--color-primary-light)',
              borderRadius: 'var(--radius-xl)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-primary)',
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700 }}>Welcome Back</h1>
          <p
            style={{
              color: 'var(--color-text-muted)',
              fontSize: 'var(--text-sm)',
              marginTop: 'var(--space-1)',
            }}
          >
            Sign in to access your Document Approval Workflow
          </p>
        </div>

        {errorBanner && (
          <div className="error-banner" role="alert" id="login-error-banner">
            <span>{errorBanner}</span>
            <button
              type="button"
              onClick={() => setErrorBanner('')}
              style={{ color: 'inherit', fontWeight: 'bold' }}
              aria-label="Dismiss error banner"
            >
              &times;
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="username-input">
              Username
            </label>
            <input
              id="username-input"
              type="text"
              className={`form-input ${errors.username ? 'is-invalid' : ''}`}
              placeholder="e.g. alice"
              value={username}
              onChange={e => {
                setUsername(e.target.value);
                if (errors.username) setErrors(prev => ({ ...prev, username: '' }));
              }}
              autoComplete="username"
              required
            />
            {errors.username && (
              <div className="form-error" id="username-error" role="alert">
                {Array.isArray(errors.username) ? errors.username[0] : errors.username}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password-input">
              Password
            </label>
            <input
              id="password-input"
              type="password"
              className={`form-input ${errors.password ? 'is-invalid' : ''}`}
              placeholder="Enter your password"
              value={password}
              onChange={e => {
                setPassword(e.target.value);
                if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
              }}
              autoComplete="current-password"
              required
            />
            {errors.password && (
              <div className="form-error" id="password-error" role="alert">
                {Array.isArray(errors.password) ? errors.password[0] : errors.password}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            id="login-submit-button"
            disabled={isSubmitting}
            style={{ marginTop: 'var(--space-4)' }}
          >
            {isSubmitting ? (
              <>
                <span className="spinner" aria-hidden="true"></span>
                <span>Signing in...</span>
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Demo Accounts Quick-Fill Section */}
        <div
          style={{
            marginTop: 'var(--space-6)',
            paddingTop: 'var(--space-4)',
            borderTop: '1px solid var(--color-border)',
          }}
        >
          <p
            style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: 'var(--space-2)',
              textAlign: 'center',
            }}
          >
            Demo Accounts (Click to Fill)
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 'var(--space-2)',
            }}
          >
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              id="quick-login-alice"
              onClick={() => fillCredentials('alice', 'submitter')}
            >
              Alice (Submitter)
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              id="quick-login-bob"
              onClick={() => fillCredentials('bob', 'submitter')}
            >
              Bob (Submitter)
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              id="quick-login-riley"
              onClick={() => fillCredentials('riley', 'reviewer')}
            >
              Riley (Reviewer)
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              id="quick-login-rohan"
              onClick={() => fillCredentials('rohan', 'reviewer')}
            >
              Rohan (Reviewer)
            </button>
          </div>
          <p
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--color-text-light)',
              textAlign: 'center',
              marginTop: 'var(--space-2)',
            }}
          >
            Password for all: <code>Passw0rd!demo</code>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
