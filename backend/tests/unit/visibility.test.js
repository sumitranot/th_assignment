import { describe, expect, it, vi } from 'vitest';
import { NotFoundError } from '../../src/lib/errors.js';
import { DocumentsService } from '../../src/modules/documents/documents.service.js';

describe('Unit: Visibility & Access Rules', () => {
  const alice = {
    id: '11111111-1111-1111-1111-111111111111',
    role: 'submitter',
    name: 'Alice',
  };

  const bob = {
    id: '22222222-2222-2222-2222-222222222222',
    role: 'submitter',
    name: 'Bob',
  };

  const riley = {
    id: '33333333-3333-3333-3333-333333333333',
    role: 'reviewer',
    name: 'Riley Reviewer',
  };

  const aliceDocId = '44444444-4444-4444-4444-444444444444';

  const aliceDoc = {
    id: aliceDocId,
    title: "Alice's Secret Project",
    submitterId: alice.id,
    submitter: { id: alice.id, name: 'Alice' },
    status: 'pending',
  };

  it('allows submitter to view their own document', async () => {
    const mockRepo = {
      findById: vi.fn(() => Promise.resolve(aliceDoc)),
    };

    const service = new DocumentsService(mockRepo);
    const result = await service.getDocumentById({
      id: aliceDocId,
      user: alice,
    });

    expect(result.id).toBe(aliceDocId);
    expect(result.title).toBe("Alice's Secret Project");
  });

  it('returns 404 (not 403) when submitter attempts to view another user document to avoid leaking existence', async () => {
    const mockRepo = {
      findById: vi.fn(() => Promise.resolve(aliceDoc)),
    };

    const service = new DocumentsService(mockRepo);
    await expect(
      service.getDocumentById({
        id: aliceDocId,
        user: bob, // Bob trying to view Alice's document
      })
    ).rejects.toThrow(NotFoundError);
  });

  it('allows reviewer to view any document', async () => {
    const mockRepo = {
      findById: vi.fn(() => Promise.resolve(aliceDoc)),
    };

    const service = new DocumentsService(mockRepo);
    const result = await service.getDocumentById({
      id: aliceDocId,
      user: riley,
    });

    expect(result.id).toBe(aliceDocId);
    expect(result.title).toBe("Alice's Secret Project");
  });

  it('scopes submitter list queries strictly to their own submitterId', async () => {
    const mockRepo = {
      findManyWithPagination: vi.fn(() => Promise.resolve({ items: [aliceDoc], total: 1 })),
    };

    const service = new DocumentsService(mockRepo);
    await service.listDocuments({ user: alice });

    expect(mockRepo.findManyWithPagination).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { submitterId: alice.id },
      })
    );
  });

  it('allows reviewer list queries across all documents', async () => {
    const mockRepo = {
      findManyWithPagination: vi.fn(() => Promise.resolve({ items: [aliceDoc], total: 1 })),
    };

    const service = new DocumentsService(mockRepo);
    await service.listDocuments({ user: riley });

    expect(mockRepo.findManyWithPagination).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {}, // No submitterId filter
      })
    );
  });
});
