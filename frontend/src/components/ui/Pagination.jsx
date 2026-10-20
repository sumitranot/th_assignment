import React from 'react';

/**
 * Accessible pagination navigation component.
 */
export const Pagination = ({
  page = 1,
  pageSize = 10,
  total = 0,
  totalPages = 1,
  onPageChange,
}) => {
  if (total <= pageSize && page === 1) return null;

  const startRecord = (page - 1) * pageSize + 1;
  const endRecord = Math.min(page * pageSize, total);

  return (
    <nav className="pagination" aria-label="Pagination Navigation">
      <span>
        Showing <strong>{total > 0 ? startRecord : 0}</strong> to <strong>{endRecord}</strong> of{' '}
        <strong>{total}</strong> results
      </span>

      <div className="pagination-controls">
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          id="pagination-prev"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          Previous
        </button>

        <span>
          Page {page} of {Math.max(1, totalPages)}
        </span>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          id="pagination-next"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          Next
        </button>
      </div>
    </nav>
  );
};

export default Pagination;
