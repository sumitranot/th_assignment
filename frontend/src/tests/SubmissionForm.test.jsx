import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SubmissionForm } from '../components/documents/SubmissionForm.jsx';
import { documentService } from '../services/documentService.js';

vi.mock('../services/documentService.js', () => ({
  documentService: {
    createDocument: vi.fn(),
  },
}));

describe('Frontend: SubmissionForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all form input fields', () => {
    render(<SubmissionForm />);
    expect(screen.getByLabelText(/document title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/text content/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit document/i })).toBeInTheDocument();
  });

  it('validates title is required before submission', async () => {
    render(<SubmissionForm />);
    fireEvent.click(screen.getByRole('button', { name: /submit document/i }));

    expect(await screen.findByText('Title is required')).toBeInTheDocument();
    expect(documentService.createDocument).not.toHaveBeenCalled();
  });

  it('validates either textContent or file is required', async () => {
    render(<SubmissionForm />);
    fireEvent.change(screen.getByLabelText(/document title/i), {
      target: { value: 'Valid Title' },
    });
    fireEvent.click(screen.getByRole('button', { name: /submit document/i }));

    expect(
      await screen.findByText('Please provide either text content or upload a file (or both)')
    ).toBeInTheDocument();
    expect(documentService.createDocument).not.toHaveBeenCalled();
  });

  it('rejects file larger than 5 MB on client side', async () => {
    render(<SubmissionForm />);
    // 6 MB file
    const oversizedFile = new File(['a'.repeat(6 * 1024 * 1024)], 'large.pdf', {
      type: 'application/pdf',
    });

    const fileInput = document.querySelector('input[type="file"]');
    fireEvent.change(fileInput, { target: { files: [oversizedFile] } });

    expect(await screen.findByText(/file size exceeds the 5 mb limit/i)).toBeInTheDocument();
  });

  it('submits form successfully with title and textContent', async () => {
    const onSuccess = vi.fn();
    documentService.createDocument.mockResolvedValueOnce({
      id: 'doc-123',
      title: 'Valid Doc Title',
      status: 'pending',
    });

    render(<SubmissionForm onSuccess={onSuccess} />);

    fireEvent.change(screen.getByLabelText(/document title/i), {
      target: { value: 'Valid Doc Title' },
    });
    fireEvent.change(screen.getByLabelText(/text content/i), {
      target: { value: 'Valid proposal text content' },
    });

    fireEvent.click(screen.getByRole('button', { name: /submit document/i }));

    await waitFor(() => {
      expect(documentService.createDocument).toHaveBeenCalled();
      expect(onSuccess).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'doc-123', title: 'Valid Doc Title' })
      );
    });
  });
});
