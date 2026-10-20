import React, { useState } from 'react';
import { documentService } from '../../services/documentService.js';
import { Button } from '../ui/Button.jsx';

/**
 * Reviewer decision controls: Approve/Reject with optional comment and confirmation dialog.
 */
export const ReviewActions = ({ documentId, onReviewed, onConflict }) => {
  const [comment, setComment] = useState('');
  const [pendingDecision, setPendingDecision] = useState(null); // 'approved' | 'rejected' | null
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [conflictError, setConflictError] = useState('');

  const initiateDecision = decision => {
    setConflictError('');
    setPendingDecision(decision);
  };

  const cancelDecision = () => {
    setPendingDecision(null);
  };

  const handleConfirmDecision = async () => {
    if (!pendingDecision) return;

    setIsSubmitting(true);
    setConflictError('');

    try {
      const updated = await documentService.updateStatus(documentId, {
        status: pendingDecision,
        comment: comment.trim() || undefined,
      });

      setPendingDecision(null);
      setComment('');
      if (onReviewed) {
        onReviewed(updated);
      }
    } catch (err) {
      if (err.status === 409 || err.code === 'invalid_transition') {
        const conflictMsg = 'This document was already reviewed by another reviewer.';
        setConflictError(conflictMsg);
        setPendingDecision(null);
        if (onConflict) {
          onConflict(conflictMsg);
        }
      } else {
        setConflictError(err.message || 'Failed to record decision');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        marginTop: 'var(--space-4)',
        paddingTop: 'var(--space-4)',
        borderTop: '1px solid var(--color-border)',
      }}
      id="review-actions-container"
    >
      <h3
        style={{
          fontSize: 'var(--text-base)',
          fontWeight: 600,
          marginBottom: 'var(--space-3)',
        }}
      >
        Review Decision
      </h3>

      {conflictError && (
        <div
          className="error-banner"
          role="alert"
          id="review-conflict-error"
          style={{ marginBottom: 'var(--space-3)' }}
        >
          <span>{conflictError}</span>
        </div>
      )}

      {/* Confirmation Step */}
      {pendingDecision ? (
        <div
          className="card"
          style={{
            backgroundColor:
              pendingDecision === 'approved'
                ? 'var(--color-approved-bg)'
                : 'var(--color-rejected-bg)',
            borderColor:
              pendingDecision === 'approved'
                ? 'var(--color-approved-border)'
                : 'var(--color-rejected-border)',
            padding: 'var(--space-4)',
          }}
          role="alertdialog"
          aria-labelledby="confirm-decision-title"
        >
          <p
            id="confirm-decision-title"
            style={{
              fontWeight: 600,
              fontSize: 'var(--text-sm)',
              marginBottom: 'var(--space-2)',
              color:
                pendingDecision === 'approved'
                  ? 'var(--color-approved-text)'
                  : 'var(--color-rejected-text)',
            }}
          >
            Confirm Decision: Are you sure you want to{' '}
            <strong style={{ textTransform: 'uppercase' }}>{pendingDecision}</strong> this document?
          </p>

          {comment.trim() && (
            <p
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--color-text-muted)',
                marginBottom: 'var(--space-3)',
                fontStyle: 'italic',
              }}
            >
              Comment: &ldquo;{comment.trim()}&rdquo;
            </p>
          )}

          <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              id="confirm-cancel-button"
              onClick={cancelDecision}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant={pendingDecision === 'approved' ? 'success' : 'danger'}
              size="sm"
              id="confirm-submit-button"
              onClick={handleConfirmDecision}
              isLoading={isSubmitting}
            >
              Yes, Confirm {pendingDecision === 'approved' ? 'Approval' : 'Rejection'}
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <div className="form-group">
            <label className="form-label" htmlFor="review-comment-input">
              <span>Reviewer Comment</span>
              <span className="optional-indicator">(optional, max 1000 chars)</span>
            </label>
            <textarea
              id="review-comment-input"
              className="form-textarea"
              rows={3}
              placeholder="Provide constructive feedback or rationale for your decision..."
              value={comment}
              onChange={e => setComment(e.target.value)}
              maxLength={1000}
              disabled={isSubmitting}
            />
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <Button
              type="button"
              variant="success"
              id="action-approve-button"
              onClick={() => initiateDecision('approved')}
              disabled={isSubmitting}
            >
              Approve Document
            </Button>
            <Button
              type="button"
              variant="danger"
              id="action-reject-button"
              onClick={() => initiateDecision('rejected')}
              disabled={isSubmitting}
            >
              Reject Document
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewActions;
