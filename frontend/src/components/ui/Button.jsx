import React from 'react';

/**
 * Accessible button component supporting variants, sizes, and loading state.
 */
export const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className = '',
  id,
  onClick,
  ...props
}) => {
  const variantClass = `btn-${variant}`;
  const sizeClass = size !== 'md' ? `btn-${size}` : '';
  const combinedClasses = `btn ${variantClass} ${sizeClass} ${className}`.trim();

  return (
    <button
      id={id}
      type={type}
      className={combinedClasses}
      disabled={disabled || isLoading}
      aria-disabled={disabled || isLoading}
      onClick={onClick}
      {...props}
    >
      {isLoading ? (
        <>
          <span className="spinner" aria-hidden="true"></span>
          <span>{children}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
