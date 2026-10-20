import path from 'path';
import { describe, expect, it } from 'vitest';
import { ALLOWED_EXTENSIONS, ALLOWED_MIME_TYPES } from '../../src/middleware/upload.js';

describe('Unit: File Validators', () => {
  it('allows all specified extensions', () => {
    const expected = ['.pdf', '.txt', '.md', '.doc', '.docx', '.png', '.jpg', '.jpeg'];
    for (const ext of expected) {
      expect(ALLOWED_EXTENSIONS).toContain(ext);
    }
  });

  it('rejects disallowed extensions', () => {
    const disallowed = ['.exe', '.sh', '.js', '.zip', '.tar', '.html', '.svg'];
    for (const ext of disallowed) {
      expect(ALLOWED_EXTENSIONS).not.toContain(ext);
    }
  });

  it('allows all specified MIME types', () => {
    const expected = [
      'application/pdf',
      'text/plain',
      'text/markdown',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/png',
      'image/jpeg',
    ];
    for (const mime of expected) {
      expect(ALLOWED_MIME_TYPES).toContain(mime);
    }
  });

  it('rejects dangerous or disallowed MIME types', () => {
    const dangerous = [
      'application/x-msdownload',
      'application/x-sh',
      'application/javascript',
      'text/html',
      'image/svg+xml',
    ];
    for (const mime of dangerous) {
      expect(ALLOWED_MIME_TYPES).not.toContain(mime);
    }
  });

  it('correctly maps extension casing', () => {
    const filename = 'DOCUMENT.PDF';
    const ext = path.extname(filename).toLowerCase();
    expect(ALLOWED_EXTENSIONS).toContain(ext);
  });
});
