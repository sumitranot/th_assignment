import React, { useState } from 'react';
import { documentService } from '../../services/documentService.js';
import { Badge } from '../ui/Badge.jsx';
import { Button } from '../ui/Button.jsx';
import { Modal } from '../ui/Modal.jsx';
import { ReviewActions } from './ReviewActions.jsx';

/**
 * Detailed view modal for a document, its metadata, attachments, and review actions.
 */
export const DocumentDetailModal = ({
  document,
  isOpen,
  onClose,
  currentUser,
  onDocumentUpdated,
  onConflict,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);

  if (!document) return null;

  const isReviewer = currentUser?.role === 'reviewer';
  const isPending = document.status === 'pending';

  const handleDownload = async () => {
    if (!document.file) return;
    setIsDownloading(true);
    try {
      await documentService.downloadFile(document.id, document.file.originalFilename);
    } catch (err) {
      alert(`Download failed: ${err.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const formatDate = dateStr => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Document Details"
      id="document-detail-modal"
      footer={
        <Button variant="secondary" onClick={onClose} id="modal-close-button">
          Close
        </Button>
      }
    >
      <div>
        {/* Title & Status */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 'var(--space-3)',
            marginBottom: 'var(--space-2)',
          }}
        >
          <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--color-text)' }}>
            {document.title}
          </h3>
          <Badge status={document.status} id="modal-status-badge" />
        </div>

        {/* Metadata info grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 'var(--space-3)',
            backgroundColor: 'var(--color-surface-subtle)',
            padding: 'var(--space-3) var(--space-4)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-muted)',
            marginBottom: 'var(--space-4)',
          }}
        >
          <div>
            <span style={{ fontWeight: 600, display: 'block', color: 'var(--color-text)' }}>
              Submitter
            </span>
            <span>{document.submitter?.name || 'Unknown'}</span>
          </div>
          <div>
            <span style={{ fontWeight: 600, display: 'block', color: 'var(--color-text)' }}>
              Submitted At
            </span>
            <span>{formatDate(document.createdAt)}</span>
          </div>
          {document.reviewedAt && (
            <div>
              <span style={{ fontWeight: 600, display: 'block', color: 'var(--color-text)' }}>
                Reviewed At
              </span>
              <span>{formatDate(document.reviewedAt)}</span>
            </div>
          )}
          {document.reviewedBy && (
            <div>
              <span style={{ fontWeight: 600, display: 'block', color: 'var(--color-text)' }}>
                Reviewed By
              </span>
              <span>{document.reviewedBy.name}</span>
            </div>
          )}
        </div>

        {/* Description */}
        {document.description && (
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <h4
              style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                textTransform: 'uppercase',
                color: 'var(--color-text-muted)',
                marginBottom: 'var(--space-1)',
              }}
            >
              Description
            </h4>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>
              {document.description}
            </p>
          </div>
        )}

        {/* Text Content */}
        {document.textContent && (
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <h4
              style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                textTransform: 'uppercase',
                color: 'var(--color-text-muted)',
                marginBottom: 'var(--space-1)',
              }}
            >
              Document Content
            </h4>
            <div
              style={{
                backgroundColor: 'var(--color-surface-subtle)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-4)',
                whiteSpace: 'pre-wrap',
                fontFamily: 'var(--font-sans)',
                fontSize: 'var(--text-sm)',
                lineHeight: 1.6,
                maxHeight: '250px',
                overflowY: 'auto',
              }}
              id="modal-text-content"
            >
              {document.textContent}
            </div>
          </div>
        )}

        {/* Attached File */}
        {document.file && (
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <h4
              style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                textTransform: 'uppercase',
                color: 'var(--color-text-muted)',
                marginBottom: 'var(--space-1)',
              }}
            >
              Attached File
            </h4>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--space-3) var(--space-4)',
                backgroundColor: 'var(--color-surface-subtle)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  style={{ color: 'var(--color-primary)' }}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                  />
                </svg>
                <span style={{ fontWeight: 500, fontSize: 'var(--text-sm)' }}>
                  {document.file.originalFilename}
                </span>
                <span style={{ color: 'var(--color-text-light)', fontSize: 'var(--text-xs)' }}>
                  ({(document.file.size / 1024).toFixed(1)} KB)
                </span>
              </div>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                id="modal-download-button"
                onClick={handleDownload}
                isLoading={isDownloading}
              >
                Download
              </Button>
            </div>
          </div>
        )}

        {/* Review Comment if already reviewed */}
        {document.reviewComment && (
          <div
            style={{
              padding: 'var(--space-4)',
              borderRadius: 'var(--radius-lg)',
              backgroundColor:
                document.status === 'approved'
                  ? 'var(--color-approved-bg)'
                  : 'var(--color-rejected-bg)',
              border: `1px solid ${
                document.status === 'approved'
                  ? 'var(--color-approved-border)'
                  : 'var(--color-rejected-border)'
              }`,
              marginTop: 'var(--space-3)',
            }}
          >
            <h4
              style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                textTransform: 'uppercase',
                color:
                  document.status === 'approved'
                    ? 'var(--color-approved-text)'
                    : 'var(--color-rejected-text)',
                marginBottom: 'var(--space-1)',
              }}
            >
              Reviewer Feedback ({document.reviewedBy?.name || 'Reviewer'})
            </h4>
            <p
              style={{
                fontSize: 'var(--text-sm)',
                color:
                  document.status === 'approved'
                    ? 'var(--color-approved-text)'
                    : 'var(--color-rejected-text)',
              }}
              id="modal-review-comment"
            >
              {document.reviewComment}
            </p>
          </div>
        )}

        {/* Reviewer Action Controls for pending documents */}
        {isReviewer && isPending && (
          <ReviewActions
            documentId={document.id}
            onReviewed={updatedDoc => {
              if (onDocumentUpdated) onDocumentUpdated(updatedDoc);
              onClose();
            }}
            onConflict={msg => {
              if (onConflict) onConflict(msg);
            }}
          />
        )}
      </div>
    </Modal>
  );
};

export default DocumentDetailModal;
