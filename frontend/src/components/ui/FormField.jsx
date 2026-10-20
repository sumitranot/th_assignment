import React from 'react';

/**
 * Accessible form field wrapper with label, error display, and hint.
 */
export const FormField = ({
  id,
  label,
  error,
  hint,
  required = false,
  optional = false,
  children,
}) => {
  const errorMessage = Array.isArray(error) ? error[0] : error;

  return (
    <div className="form-group">
      {label && (
        <label className="form-label" htmlFor={id}>
          <span>
            {label}{' '}
            {required && (
              <span aria-hidden="true" style={{ color: 'var(--color-rejected)' }}>
                *
              </span>
            )}
          </span>
          {optional && <span className="optional-indicator">(optional)</span>}
        </label>
      )}

      {children}

      {hint && !errorMessage && (
        <p className="form-hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}

      {errorMessage && (
        <p className="form-error" id={`${id}-error`} role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
};

export default FormField;
