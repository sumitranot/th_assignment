import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export const NotFoundPage = () => {
  const { user } = useAuth();
  const homePath = user ? (user.role === 'reviewer' ? '/review' : '/submit') : '/login';

  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: 'var(--space-6)',
      }}
    >
      <div
        style={{
          fontSize: '5rem',
          fontWeight: 800,
          color: 'var(--color-primary)',
          lineHeight: 1,
          marginBottom: 'var(--space-4)',
        }}
      >
        404
      </div>
      <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
        Page Not Found
      </h1>
      <p
        style={{
          color: 'var(--color-text-muted)',
          maxWidth: '480px',
          marginBottom: 'var(--space-6)',
        }}
      >
        The page you are looking for does not exist or has been moved.
      </p>
      <Link to={homePath} className="btn btn-primary btn-lg" id="back-home-link">
        Return to Dashboard
      </Link>
    </div>
  );
};

export default NotFoundPage;
