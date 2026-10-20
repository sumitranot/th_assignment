import React from 'react';

const STATUS_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
];

/**
 * Filter tabs for switching between document statuses.
 */
export const StatusFilter = ({ currentStatus = '', onStatusChange }) => {
  return (
    <div className="status-filters" role="group" aria-label="Filter documents by status">
      {STATUS_OPTIONS.map(opt => {
        const isActive = currentStatus === opt.value;
        return (
          <button
            key={opt.value || 'all'}
            type="button"
            className={`filter-btn ${isActive ? 'active' : ''}`}
            id={`filter-${opt.value || 'all'}`}
            onClick={() => onStatusChange(opt.value)}
            aria-pressed={isActive}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};

export default StatusFilter;
