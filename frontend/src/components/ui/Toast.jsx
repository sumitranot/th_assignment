import React from 'react';

/**
 * Accessible toast notifications container with aria-live="polite".
 */
export const Toast = ({ toasts = [], onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-live="polite" aria-atomic="true" role="status">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          <span>{toast.message}</span>
          {onDismiss && (
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              style={{
                color: 'inherit',
                background: 'none',
                border: 'none',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
              aria-label="Dismiss notification"
            >
              &times;
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default Toast;
