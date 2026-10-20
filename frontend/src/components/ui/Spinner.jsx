import React from 'react';

export const Spinner = ({ size = 20, label = 'Loading...', className = '' }) => {
  return (
    <div
      className={`spinner ${className}`}
      role="status"
      aria-label={label}
      style={{ width: size, height: size }}
    >
      <span className="sr-only">{label}</span>
    </div>
  );
};

export default Spinner;
