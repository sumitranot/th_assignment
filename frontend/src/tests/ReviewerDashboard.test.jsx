import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthContext } from '../context/AuthContext.jsx';
import { ReviewerDashboard } from '../pages/ReviewerDashboard.jsx';
import { ApiError } from '../services/apiClient.js';
import { documentService } from '../services/documentService.js';

vi.mock('../services/documentService.js', () => ({
  documentService: {
    listDocuments: vi.fn(),
    updateStatus: vi.fn(),
    downloadFile: vi.fn(),
  },
}));

describe('Frontend: ReviewerDashboard & Decision Flow', () => {
  const reviewerUser = {
    id: 'rev-1',
    username: 'riley',
    name: 'Riley Reviewer',
    role: 'reviewer',
  };

  const samplePendingDoc = {
    id: 'doc-pending-1',
    title: 'Architecture RFC: Event Bus',
    description: 'Transitioning to RabbitMQ',
    textContent: 'Full architecture text specification...',
    status: 'pending',
    submitter: { id: 'sub-1', name: 'Alice Submitter' },
    createdAt: new Date().toISOString(),
    file: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    documentService.listDocuments.mockResolvedValue({
      data: [samplePendingDoc],
      pagination: { page: 1, pageSize: 10, total: 1, totalPages: 1 },
    });
  });

  const renderDashboard = () => {
    return render(
      <AuthContext.Provider
        value={{
          user: reviewerUser,
          isAuthenticated: true,
          isLoading: false,
          logout: vi.fn(),
        }}
      >
        <ReviewerDashboard />
      </AuthContext.Provider>
    );
  };

  it('renders reviewer queue with pending documents by default', async () => {
    renderDashboard();

    expect(await screen.findByText('Architecture RFC: Event Bus')).toBeInTheDocument();
    expect(screen.getByText('Alice Submitter')).toBeInTheDocument();
    const pendingFilter = screen.getByRole('button', { name: /^pending$/i });
    expect(pendingFilter).toHaveClass('active');
  });

  it('opens detail modal and approves document with confirmation', async () => {
    documentService.updateStatus.mockResolvedValueOnce({
      ...samplePendingDoc,
      status: 'approved',
      reviewedBy: reviewerUser,
      reviewedAt: new Date().toISOString(),
    });

    renderDashboard();

    // Open detail modal
    const viewBtn = await screen.findByRole('button', { name: /view details/i });
    fireEvent.click(viewBtn);

    // Modal opens
    expect(await screen.findByText('Document Details')).toBeInTheDocument();
    expect(screen.getByText('Document Content')).toBeInTheDocument();

    // Click Approve
    const approveBtn = screen.getByRole('button', { name: /approve document/i });
    fireEvent.click(approveBtn);

    // Confirm step appears
    expect(screen.getByText(/confirm decision: are you sure/i)).toBeInTheDocument();
    const confirmBtn = screen.getByRole('button', { name: /yes, confirm approval/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(documentService.updateStatus).toHaveBeenCalledWith(
        'doc-pending-1',
        expect.objectContaining({ status: 'approved' })
      );
    });
  });

  it('handles 409 conflict gracefully when document was already reviewed by another reviewer', async () => {
    documentService.updateStatus.mockRejectedValueOnce(
      new ApiError({
        status: 409,
        code: 'invalid_transition',
        message: 'Document has already been decided (approved) and cannot be transitioned',
      })
    );

    renderDashboard();

    // Open detail modal
    const viewBtn = await screen.findByRole('button', { name: /view details/i });
    fireEvent.click(viewBtn);

    // Click Reject
    const rejectBtn = screen.getByRole('button', { name: /reject document/i });
    fireEvent.click(rejectBtn);

    // Confirm rejection
    const confirmBtn = screen.getByRole('button', { name: /yes, confirm rejection/i });
    fireEvent.click(confirmBtn);

    // Conflict error banner displayed
    await waitFor(() => {
      expect(screen.getAllByText(/this document was already reviewed/i).length).toBeGreaterThan(0);
    });

    // Automatically re-fetches list to synchronize queue
    expect(documentService.listDocuments).toHaveBeenCalledTimes(2);
  });
});
