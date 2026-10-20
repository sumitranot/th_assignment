import React from 'react';

/**
 * Global alert banner for network and server errors with optional retry.
 */
export const ErrorBanner = ({ error, message, onRetry, onDismiss, id = 'error-banner' }) => {
  const displayMessage =
    message || error?.message || 'An unexpected error occurred. Please try again.';

  if (!displayMessage && !error) return null;

  return (
    <div id={id} className="error-banner" role="alert">
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span>{displayMessage}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        {onRetry && (
          <button
            type="button"
            className="btn btn-sm btn-secondary"
            onClick={onRetry}
            style={{ padding: '0.2rem 0.5rem', fontSize: 'var(--text-xs)' }}
          >
            Retry
          </button>
        )}
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            style={{ color: 'inherit', fontWeight: 'bold', fontSize: 'var(--text-base)' }}
            aria-label="Dismiss error banner"
          >
            &times;
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorBanner;
