import React from 'react';
import { Badge } from '../ui/Badge.jsx';
import { Button } from '../ui/Button.jsx';
import { EmptyState } from '../ui/EmptyState.jsx';
import { Skeleton } from '../ui/Skeleton.jsx';

/**
 * Responsive document table that gracefully converts to card layout on small screens.
 */
export const DocumentTable = ({
  documents = [],
  isLoading = false,
  onSelectDocument,
  showSubmitter = false,
}) => {
  if (isLoading) {
    return (
      <div className="table-container" style={{ padding: 'var(--space-6)' }}>
        <Skeleton height={28} count={5} />
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="table-container">
        <EmptyState
          title="No documents to show"
          description="There are no submissions matching your selected filter."
        />
      </div>
    );
  }

  const formatDate = dateStr => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="table-container">
      <table className="data-table" aria-label="Documents list">
        <thead>
          <tr>
            <th scope="col">Title</th>
            {showSubmitter && <th scope="col">Submitter</th>}
            <th scope="col">Status</th>
            <th scope="col">Date</th>
            <th scope="col">Attachment</th>
            <th scope="col">Reviewer Comment</th>
            <th scope="col" style={{ textAlign: 'right' }}>
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {documents.map(doc => (
            <tr key={doc.id} id={`doc-row-${doc.id}`}>
              <td data-label="Title">
                <div>
                  <span style={{ fontWeight: 600, display: 'block' }}>{doc.title}</span>
                  {doc.description && (
                    <span
                      style={{
                        fontSize: 'var(--text-xs)',
                        color: 'var(--color-text-muted)',
                        display: '-webkit-box',
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {doc.description}
                    </span>
                  )}
                </div>
              </td>

              {showSubmitter && (
                <td data-label="Submitter">
                  <span>{doc.submitter?.name || 'Unknown'}</span>
                </td>
              )}

              <td data-label="Status">
                <Badge status={doc.status} id={`badge-${doc.id}`} />
              </td>

              <td data-label="Date">
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                  {formatDate(doc.createdAt)}
                </span>
              </td>

              <td data-label="Attachment">
                {doc.file ? (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 'var(--space-1)',
                      fontSize: 'var(--text-xs)',
                      color: 'var(--color-primary)',
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                      />
                    </svg>
                    <span>{doc.file.originalFilename}</span>
                  </span>
                ) : (
                  <span style={{ color: 'var(--color-text-light)', fontSize: 'var(--text-xs)' }}>
                    None
                  </span>
                )}
              </td>

              <td data-label="Reviewer Comment">
                {doc.reviewComment ? (
                  <span
                    style={{
                      fontSize: 'var(--text-xs)',
                      fontStyle: 'italic',
                      color: 'var(--color-text-muted)',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                    title={doc.reviewComment}
                  >
                    &ldquo;{doc.reviewComment}&rdquo;
                  </span>
                ) : (
                  <span style={{ color: 'var(--color-text-light)', fontSize: 'var(--text-xs)' }}>
                    —
                  </span>
                )}
              </td>

              <td data-label="Action" style={{ textAlign: 'right' }}>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  id={`view-details-${doc.id}`}
                  onClick={() => onSelectDocument(doc)}
                >
                  View Details
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DocumentTable;
