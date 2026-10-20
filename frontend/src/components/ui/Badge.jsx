import React from 'react';

/**
 * Status and role badge with color tokens and dot indicator.
 */
export const Badge = ({ status, label, showDot = true, className = '', id }) => {
  const normalizedStatus = (status || '').toLowerCase();
  const displayLabel = label || normalizedStatus;
  const badgeClass = `badge badge-${normalizedStatus} ${className}`.trim();

  return (
    <span id={id} className={badgeClass} role="status">
      {showDot && <span className="badge-dot" aria-hidden="true"></span>}
      <span>{displayLabel}</span>
    </span>
  );
};

export default Badge;
