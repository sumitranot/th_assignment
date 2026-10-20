import React, { useEffect, useRef } from 'react';

/**
 * Accessible modal dialog with focus management, backdrop, and ESC key listener.
 */
export const Modal = ({ isOpen, onClose, title, children, footer, id = 'modal-dialog' }) => {
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement;
      // Focus dialog on open
      if (dialogRef.current) {
        dialogRef.current.focus();
      }

      // Handle ESC key
      const handleKeyDown = e => {
        if (e.key === 'Escape') {
          onClose();
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
        // Restore previous focus on close
        if (previousFocusRef.current && previousFocusRef.current.focus) {
          previousFocusRef.current.focus();
        }
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={e => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="presentation"
    >
      <div
        id={id}
        ref={dialogRef}
        className="modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        tabIndex={-1}
      >
        <div className="modal-header">
          <h2 id={`${id}-title`}>{title}</h2>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            &times;
          </button>
        </div>

        <div className="modal-body">{children}</div>

        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;
