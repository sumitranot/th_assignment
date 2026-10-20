import { describe, expect, it, vi } from 'vitest';
import { ValidationError } from '../../src/lib/errors.js';
import { DocumentsService } from '../../src/modules/documents/documents.service.js';

describe('Unit: Document Creation Rules', () => {
  const mockRepo = {
    create: vi.fn(data => Promise.resolve({ id: 'doc-uuid-1', ...data })),
  };

  const mockStorage = {
    deleteFile: vi.fn(() => Promise.resolve()),
  };

  const service = new DocumentsService(mockRepo, mockStorage);

  it('accepts submission with textContent only', async () => {
    const doc = await service.createDocument({
      submitterId: 'user-1',
      title: 'Only Text Submission',
      textContent: 'Some text content here',
    });

    expect(doc.title).toBe('Only Text Submission');
    expect(doc.textContent).toBe('Some text content here');
    expect(doc.file).toBeNull();
    expect(doc.status).toBe('pending');
  });

  it('accepts submission with file only', async () => {
    const fakeFile = {
      filename: 'uuid-123.pdf',
      originalname: 'report.pdf',
      mimetype: 'application/pdf',
      size: 1024,
    };

    const doc = await service.createDocument({
      submitterId: 'user-1',
      title: 'Only File Submission',
      file: fakeFile,
    });

    expect(doc.title).toBe('Only File Submission');
    expect(doc.file).not.toBeNull();
    expect(doc.file.originalFilename).toBe('report.pdf');
    expect(doc.file.mimeType).toBe('application/pdf');
    expect(doc.file.size).toBe(1024);
  });

  it('accepts submission with both textContent and file', async () => {
    const fakeFile = {
      filename: 'uuid-456.png',
      originalname: 'diagram.png',
      mimetype: 'image/png',
      size: 2048,
    };

    const doc = await service.createDocument({
      submitterId: 'user-1',
      title: 'Both Text and File',
      textContent: 'See attached architecture diagram',
      file: fakeFile,
    });

    expect(doc.title).toBe('Both Text and File');
    expect(doc.textContent).toBe('See attached architecture diagram');
    expect(doc.file.originalFilename).toBe('diagram.png');
  });

  it('rejects submission when neither file nor textContent is provided', async () => {
    await expect(
      service.createDocument({
        submitterId: 'user-1',
        title: 'Empty Content Submission',
      })
    ).rejects.toThrow(ValidationError);
  });

  it('rejects submission when title is missing or only whitespace', async () => {
    await expect(
      service.createDocument({
        submitterId: 'user-1',
        title: '   ',
        textContent: 'Some valid text',
      })
    ).rejects.toThrow(ValidationError);
  });

  it('cleans up uploaded file if validation fails', async () => {
    const fakeFile = {
      filename: 'orphan-candidate.pdf',
      originalname: 'orphan.pdf',
      mimetype: 'application/pdf',
      size: 500,
    };

    await expect(
      service.createDocument({
        submitterId: 'user-1',
        title: '   ', // Invalid title
        file: fakeFile,
      })
    ).rejects.toThrow(ValidationError);

    expect(mockStorage.deleteFile).toHaveBeenCalledWith('orphan-candidate.pdf');
  });
});
