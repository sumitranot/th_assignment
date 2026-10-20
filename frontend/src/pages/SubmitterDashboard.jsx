import React, { useState } from 'react';
import { DocumentDetailModal } from '../components/documents/DocumentDetailModal.jsx';
import { DocumentTable } from '../components/documents/DocumentTable.jsx';
import { StatusFilter } from '../components/documents/StatusFilter.jsx';
import { SubmissionForm } from '../components/documents/SubmissionForm.jsx';
import { ErrorBanner } from '../components/ui/ErrorBanner.jsx';
import { Pagination } from '../components/ui/Pagination.jsx';
import { Toast } from '../components/ui/Toast.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useDocuments } from '../hooks/useDocuments.js';
import { useToast } from '../hooks/useToast.js';

export const SubmitterDashboard = () => {
  const { user } = useAuth();
  const { documents, pagination, status, isLoading, error, setStatus, setPage, refresh } =
    useDocuments({ pageSize: 10 });

  const { toasts, success, removeToast } = useToast();
  const [selectedDoc, setSelectedDoc] = useState(null);

  const handleSubmissionSuccess = createdDoc => {
    success(`Document "${createdDoc.title}" submitted successfully!`);
    refresh();
  };

  return (
    <div id="submitter-dashboard">
      <Toast toasts={toasts} onDismiss={removeToast} />

      <div className="page-header">
        <h1>Submitter Dashboard</h1>
        <p>Submit documents for evaluation and monitor their review decisions.</p>
      </div>

      {error && <ErrorBanner error={error} onRetry={refresh} id="submitter-error-banner" />}

      <div className="dashboard-grid submitter-grid">
        {/* Left Column: Submission Form */}
        <div className="card" id="submission-card">
          <div className="card-header">
            <h2 className="card-title">New Submission</h2>
            <p className="card-subtitle">
              Upload a document or provide text content for evaluation
            </p>
          </div>
          <SubmissionForm onSuccess={handleSubmissionSuccess} />
        </div>

        {/* Right Column: My Submissions */}
        <div className="card" id="my-submissions-card">
          <div className="card-header">
            <h2 className="card-title">My Submissions</h2>
            <p className="card-subtitle">
              Track status updates and reviewer comments on your submissions
            </p>
          </div>

          <StatusFilter currentStatus={status} onStatusChange={setStatus} />

          <DocumentTable
            documents={documents}
            isLoading={isLoading}
            onSelectDocument={doc => setSelectedDoc(doc)}
            showSubmitter={false}
          />

          <Pagination
            page={pagination.page}
            pageSize={pagination.pageSize}
            total={pagination.total}
            totalPages={pagination.totalPages}
            onPageChange={setPage}
          />
        </div>
      </div>

      {/* Document Detail Modal */}
      <DocumentDetailModal
        document={selectedDoc}
        isOpen={Boolean(selectedDoc)}
        onClose={() => setSelectedDoc(null)}
        currentUser={user}
      />
    </div>
  );
};

export default SubmitterDashboard;
