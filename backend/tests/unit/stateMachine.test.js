import { describe, expect, it, vi } from 'vitest';
import { ConflictError, NotFoundError } from '../../src/lib/errors.js';
import { DocumentsService } from '../../src/modules/documents/documents.service.js';

describe('Unit: State Machine Status Transitions', () => {
  const reviewer = {
    id: 'f87a8b60-1234-4567-89ab-cdef01234567',
    role: 'reviewer',
    name: 'Riley Reviewer',
  };

  const validUuid = '123e4567-e89b-12d3-a456-426614174000';

  it('allows pending -> approved transition', async () => {
    const mockRepo = {
      atomicUpdateStatus: vi.fn(() => Promise.resolve(1)),
      findById: vi.fn(() =>
        Promise.resolve({
          id: validUuid,
          title: 'Proposal',
          status: 'approved',
          reviewer: { id: reviewer.id, name: reviewer.name },
          submitter: { id: 'user-1', name: 'Alice' },
        })
      ),
    };

    const service = new DocumentsService(mockRepo);
    const result = await service.updateDocumentStatus({
      id: validUuid,
      user: reviewer,
      status: 'approved',
      comment: 'LGTM',
    });

    expect(mockRepo.atomicUpdateStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        id: validUuid,
        status: 'approved',
        reviewerId: reviewer.id,
        reviewComment: 'LGTM',
      })
    );
    expect(result.status).toBe('approved');
  });

  it('allows pending -> rejected transition', async () => {
    const mockRepo = {
      atomicUpdateStatus: vi.fn(() => Promise.resolve(1)),
      findById: vi.fn(() =>
        Promise.resolve({
          id: validUuid,
          title: 'Proposal',
          status: 'rejected',
          reviewer: { id: reviewer.id, name: reviewer.name },
          submitter: { id: 'user-1', name: 'Alice' },
        })
      ),
    };

    const service = new DocumentsService(mockRepo);
    const result = await service.updateDocumentStatus({
      id: validUuid,
      user: reviewer,
      status: 'rejected',
      comment: 'Not aligned with roadmap',
    });

    expect(result.status).toBe('rejected');
  });

  it('rejects approved -> rejected transition with 409 Conflict', async () => {
    const mockRepo = {
      atomicUpdateStatus: vi.fn(() => Promise.resolve(0)), // Failed because status is not pending
      findById: vi.fn(() =>
        Promise.resolve({
          id: validUuid,
          status: 'approved',
        })
      ),
    };

    const service = new DocumentsService(mockRepo);
    await expect(
      service.updateDocumentStatus({
        id: validUuid,
        user: reviewer,
        status: 'rejected',
      })
    ).rejects.toThrow(ConflictError);
  });

  it('rejects rejected -> approved transition with 409 Conflict', async () => {
    const mockRepo = {
      atomicUpdateStatus: vi.fn(() => Promise.resolve(0)),
      findById: vi.fn(() =>
        Promise.resolve({
          id: validUuid,
          status: 'rejected',
        })
      ),
    };

    const service = new DocumentsService(mockRepo);
    await expect(
      service.updateDocumentStatus({
        id: validUuid,
        user: reviewer,
        status: 'approved',
      })
    ).rejects.toThrow(ConflictError);
  });

  it('rejects repeat decision (approved -> approved) with 409 Conflict', async () => {
    const mockRepo = {
      atomicUpdateStatus: vi.fn(() => Promise.resolve(0)),
      findById: vi.fn(() =>
        Promise.resolve({
          id: validUuid,
          status: 'approved',
        })
      ),
    };

    const service = new DocumentsService(mockRepo);
    await expect(
      service.updateDocumentStatus({
        id: validUuid,
        user: reviewer,
        status: 'approved',
      })
    ).rejects.toThrow(ConflictError);
  });

  it('returns 404 when updating non-existent document', async () => {
    const mockRepo = {
      atomicUpdateStatus: vi.fn(() => Promise.resolve(0)),
      findById: vi.fn(() => Promise.resolve(null)),
    };

    const service = new DocumentsService(mockRepo);
    await expect(
      service.updateDocumentStatus({
        id: validUuid,
        user: reviewer,
        status: 'approved',
      })
    ).rejects.toThrow(NotFoundError);
  });
});
