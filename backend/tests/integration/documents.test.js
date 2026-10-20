import fs from 'fs';
import path from 'path';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../../src/app.js';
import { env } from '../../src/config/env.js';
import { TEST_PASSWORD } from '../setup/testDb.js';

describe('Integration: Documents API', () => {
  const getTokens = async () => {
    const aliceRes = await request(app).post('/api/auth/login').send({
      username: 'alice',
      password: TEST_PASSWORD,
    });
    const bobRes = await request(app).post('/api/auth/login').send({
      username: 'bob',
      password: TEST_PASSWORD,
    });
    const rileyRes = await request(app).post('/api/auth/login').send({
      username: 'riley',
      password: TEST_PASSWORD,
    });

    return {
      aliceToken: aliceRes.body.token,
      aliceId: aliceRes.body.user.id,
      bobToken: bobRes.body.token,
      bobId: bobRes.body.user.id,
      rileyToken: rileyRes.body.token,
      rileyId: rileyRes.body.user.id,
    };
  };

  it('POST /api/documents allows submitter to create document with text content only', async () => {
    const { aliceToken } = await getTokens();

    const res = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${aliceToken}`)
      .field('title', 'Text Only Proposal')
      .field('textContent', 'This is full text proposal content.');

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Text Only Proposal');
    expect(res.body.textContent).toBe('This is full text proposal content.');
    expect(res.body.file).toBeNull();
    expect(res.body.status).toBe('pending');
    expect(res.body.submitter.name).toBe('Alice Submitter');
  });

  it('POST /api/documents allows submitter to create document with file upload only', async () => {
    const { aliceToken } = await getTokens();
    const testPdfBuffer = Buffer.from('%PDF-1.4 test file content');

    const res = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${aliceToken}`)
      .field('title', 'PDF Only Report')
      .attach('file', testPdfBuffer, 'report.pdf');

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('PDF Only Report');
    expect(res.body.file).not.toBeNull();
    expect(res.body.file.originalFilename).toBe('report.pdf');
    expect(res.body.file.mimeType).toBe('application/pdf');
    expect(res.body.file.downloadUrl).toBe(`/api/documents/${res.body.id}/file`);
    expect(res.body).not.toHaveProperty('filePath');
  });

  it('POST /api/documents rejects submission when both textContent and file are missing', async () => {
    const { aliceToken } = await getTokens();

    const res = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${aliceToken}`)
      .field('title', 'Empty Content Document');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('validation_error');
    expect(res.body.error.details).toHaveProperty('content');
  });

  it('POST /api/documents rejects empty (0 bytes) file upload', async () => {
    const { aliceToken } = await getTokens();
    const emptyBuffer = Buffer.from('');

    const res = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${aliceToken}`)
      .field('title', 'Zero Byte Test')
      .attach('file', emptyBuffer, 'empty.txt');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('validation_error');
    expect(res.body.error.message).toContain('empty');
  });

  it('POST /api/documents rejects unsupported file extensions with 415', async () => {
    const { aliceToken } = await getTokens();
    const exeBuffer = Buffer.from('MZ binary executable content');

    const res = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${aliceToken}`)
      .field('title', 'Executable Test')
      .attach('file', exeBuffer, 'malicious.exe');

    expect(res.status).toBe(415);
    expect(res.body.error.code).toBe('unsupported_file_type');
  });

  it('POST /api/documents rejects files exceeding 5 MB with 413', async () => {
    const { aliceToken } = await getTokens();
    // 5.5 MB buffer
    const largeBuffer = Buffer.alloc(5.5 * 1024 * 1024);

    const res = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${aliceToken}`)
      .field('title', 'Oversized Document')
      .attach('file', largeBuffer, 'huge.pdf');

    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe('file_too_large');
  });

  it('POST /api/documents rejects reviewer attempting to submit with 403 Forbidden', async () => {
    const { rileyToken } = await getTokens();

    const res = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${rileyToken}`)
      .field('title', 'Reviewer Attempt')
      .field('textContent', 'Content from reviewer');

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('forbidden');
  });

  it('PATCH /api/documents/:id/status rejects submitter with 403 Forbidden', async () => {
    const { aliceToken } = await getTokens();

    // Alice creates a document
    const createRes = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${aliceToken}`)
      .field('title', 'Document to Self-Approve')
      .field('textContent', 'Content');

    const docId = createRes.body.id;

    // Alice tries to approve her own document
    const res = await request(app)
      .patch(`/api/documents/${docId}/status`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ status: 'approved' });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('forbidden');
  });

  it('GET /api/documents/:id returns 404 (not 403) when submitter requests another user document', async () => {
    const { aliceToken, bobToken } = await getTokens();

    // Alice creates a document
    const aliceDoc = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${aliceToken}`)
      .field('title', 'Alice Private Doc')
      .field('textContent', 'Alice secrets');

    // Bob tries to view Alice's document
    const res = await request(app)
      .get(`/api/documents/${aliceDoc.body.id}`)
      .set('Authorization', `Bearer ${bobToken}`);

    // Must return 404 to avoid leaking existence
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('not_found');
  });

  it('GET /api/documents/:id allows reviewer to view any submitter document', async () => {
    const { aliceToken, rileyToken } = await getTokens();

    const aliceDoc = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${aliceToken}`)
      .field('title', 'Alice Doc for Review')
      .field('textContent', 'Content for review');

    const res = await request(app)
      .get(`/api/documents/${aliceDoc.body.id}`)
      .set('Authorization', `Bearer ${rileyToken}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(aliceDoc.body.id);
    expect(res.body.title).toBe('Alice Doc for Review');
  });

  it('GET /api/documents/:id returns 404 (not 500) for invalid non-UUID id', async () => {
    const { aliceToken } = await getTokens();

    const res = await request(app)
      .get('/api/documents/not-a-valid-uuid-format')
      .set('Authorization', `Bearer ${aliceToken}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('not_found');
  });

  it('GET /api/documents lists own documents for submitter and all for reviewer with status filtering and pagination', async () => {
    const { aliceToken, bobToken, rileyToken } = await getTokens();

    // Alice creates 2 docs
    await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${aliceToken}`)
      .field('title', 'Alice Doc 1')
      .field('textContent', 'Content 1');

    await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${aliceToken}`)
      .field('title', 'Alice Doc 2')
      .field('textContent', 'Content 2');

    // Bob creates 1 doc
    await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${bobToken}`)
      .field('title', 'Bob Doc 1')
      .field('textContent', 'Content 3');

    // Alice list
    const aliceList = await request(app)
      .get('/api/documents')
      .set('Authorization', `Bearer ${aliceToken}`);
    expect(aliceList.status).toBe(200);
    expect(aliceList.body.data.length).toBe(2);
    expect(aliceList.body.pagination.total).toBe(2);

    // Reviewer list sees all 3 docs
    const reviewerList = await request(app)
      .get('/api/documents')
      .set('Authorization', `Bearer ${rileyToken}`);
    expect(reviewerList.status).toBe(200);
    expect(reviewerList.body.data.length).toBe(3);
    expect(reviewerList.body.pagination.total).toBe(3);

    // Status filter
    const pendingList = await request(app)
      .get('/api/documents?status=pending')
      .set('Authorization', `Bearer ${rileyToken}`);
    expect(pendingList.status).toBe(200);
    expect(pendingList.body.data.length).toBe(3);

    // Invalid status filter returns 400
    const invalidStatusList = await request(app)
      .get('/api/documents?status=unknown_status')
      .set('Authorization', `Bearer ${rileyToken}`);
    expect(invalidStatusList.status).toBe(400);
    expect(invalidStatusList.body.error.code).toBe('validation_error');
  });

  it('GET /api/documents/:id/file downloads authorized file and enforces visibility rules', async () => {
    const { aliceToken, bobToken, rileyToken } = await getTokens();
    const fileContent = 'Sample file download test content';
    const buffer = Buffer.from(fileContent);

    const docRes = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${aliceToken}`)
      .field('title', 'Downloadable Document')
      .attach('file', buffer, 'sample.txt');

    const docId = docRes.body.id;

    // Alice downloads own file
    const aliceDownload = await request(app)
      .get(`/api/documents/${docId}/file`)
      .set('Authorization', `Bearer ${aliceToken}`);
    expect(aliceDownload.status).toBe(200);
    expect(aliceDownload.text).toBe(fileContent);

    // Reviewer downloads file
    const reviewerDownload = await request(app)
      .get(`/api/documents/${docId}/file`)
      .set('Authorization', `Bearer ${rileyToken}`);
    expect(reviewerDownload.status).toBe(200);
    expect(reviewerDownload.text).toBe(fileContent);

    // Bob (another submitter) gets 404
    const bobDownload = await request(app)
      .get(`/api/documents/${docId}/file`)
      .set('Authorization', `Bearer ${bobToken}`);
    expect(bobDownload.status).toBe(404);
  });

  it('cleans up orphan files from disk when validation fails after multer write', async () => {
    const { aliceToken } = await getTokens();
    const buffer = Buffer.from('Orphan test content');
    const uploadDir = path.resolve(env.UPLOAD_DIR);

    // Record files on disk before request
    const filesBefore = fs.existsSync(uploadDir) ? fs.readdirSync(uploadDir) : [];

    // Submit with empty title (validation failure)
    const res = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${aliceToken}`)
      .field('title', '   ') // whitespace-only title
      .attach('file', buffer, 'orphan.txt');

    expect(res.status).toBe(400);

    // Verify no new files remain in upload directory
    const filesAfter = fs.existsSync(uploadDir) ? fs.readdirSync(uploadDir) : [];
    expect(filesAfter.length).toBe(filesBefore.length);
  });
});
