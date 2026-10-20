import React, { useState } from 'react';
import { DocumentDetailModal } from '../components/documents/DocumentDetailModal.jsx';
import { DocumentTable } from '../components/documents/DocumentTable.jsx';
import { StatusFilter } from '../components/documents/StatusFilter.jsx';
import { ErrorBanner } from '../components/ui/ErrorBanner.jsx';
import { Pagination } from '../components/ui/Pagination.jsx';
import { Toast } from '../components/ui/Toast.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useDocuments } from '../hooks/useDocuments.js';
import { useToast } from '../hooks/useToast.js';

export const ReviewerDashboard = () => {
  const { user } = useAuth();

  // Reviewer dashboard defaults to 'pending' as specified by the brief
  const {
    documents,
    pagination,
    status,
    isLoading,
    error,
    setStatus,
    setPage,
    refresh,
    updateLocalDocument,
  } = useDocuments({ initialStatus: 'pending', pageSize: 10 });

  const { toasts, success, error: toastError, removeToast } = useToast();
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [conflictBanner, setConflictBanner] = useState('');

  const handleDocumentUpdated = updatedDoc => {
    success(`Document "${updatedDoc.title}" marked as ${updatedDoc.status}.`);
    updateLocalDocument(updatedDoc);
    // Refresh queue list
    refresh();
  };

  const handleConflict = msg => {
    setConflictBanner(msg || 'This document was already reviewed.');
    toastError(msg || 'This document was already reviewed by another reviewer.');
    // Re-fetch documents immediately to reflect current state
    refresh();
  };

  return (
    <div id="reviewer-dashboard">
      <Toast toasts={toasts} onDismiss={removeToast} />

      <div className="page-header">
        <h1>Document Review Queue</h1>
        <p>
          Evaluate submissions, inspect attachments, and record decisions with optional feedback.
        </p>
      </div>

      {conflictBanner && (
        <ErrorBanner
          message={conflictBanner}
          onDismiss={() => setConflictBanner('')}
          onRetry={refresh}
          id="reviewer-conflict-banner"
        />
      )}

      {error && <ErrorBanner error={error} onRetry={refresh} id="reviewer-error-banner" />}

      <div className="card" id="review-queue-card">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 'var(--space-3)',
            marginBottom: 'var(--space-4)',
          }}
        >
          <div>
            <h2 className="card-title">Submissions Queue</h2>
            <p className="card-subtitle">Review queue defaulting to pending submissions</p>
          </div>

          <StatusFilter
            currentStatus={status}
            onStatusChange={newStatus => {
              setConflictBanner('');
              setStatus(newStatus);
            }}
          />
        </div>

        <DocumentTable
          documents={documents}
          isLoading={isLoading}
          onSelectDocument={doc => {
            setConflictBanner('');
            setSelectedDoc(doc);
          }}
          showSubmitter={true}
        />

        <Pagination
          page={pagination.page}
          pageSize={pagination.pageSize}
          total={pagination.total}
          totalPages={pagination.totalPages}
          onPageChange={setPage}
        />
      </div>

      {/* Document Detail & Review Decision Modal */}
      <DocumentDetailModal
        document={selectedDoc}
        isOpen={Boolean(selectedDoc)}
        onClose={() => setSelectedDoc(null)}
        currentUser={user}
        onDocumentUpdated={handleDocumentUpdated}
        onConflict={handleConflict}
      />
    </div>
  );
};

export default ReviewerDashboard;
