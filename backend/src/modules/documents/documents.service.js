import { ConflictError, NotFoundError, ValidationError } from '../../lib/errors.js';
import { isValidUuid } from './documents.schema.js';
import { documentsRepository } from './documents.repository.js';
import { fileStorage } from './fileStorage.js';

/**
 * Business logic service for document submissions, status review state machine, and visibility rules.
 */
export class DocumentsService {
  /**
   * @param {import('./documents.repository.js').DocumentsRepository} [repository]
   * @param {import('../../storage/storageInterface.js').StorageInterface} [storage]
   */
  constructor(repository = documentsRepository, storage = fileStorage) {
    this.repository = repository;
    this.storage = storage;
  }

  /**
   * Submits a new document.
   * Enforces rules:
   * 1. Submitter ID taken exclusively from authenticated user token.
   * 2. Requires title plus at least one of file or textContent.
   * 3. Deletes uploaded file on disk if validation fails (no orphan files).
   *
   * @param {object} params
   * @param {string} params.submitterId - Submitter user ID from JWT.
   * @param {string} params.title
   * @param {string} [params.description]
   * @param {string} [params.textContent]
   * @param {object} [params.file] - Uploaded file from Multer.
   * @returns {Promise<object>} Formatted document response.
   */
  async createDocument({ submitterId, title, description, textContent, file }) {
    const trimmedTitle = (title || '').trim();
    const trimmedText = (textContent || '').trim();
    const hasText = trimmedText.length > 0;
    const hasFile = Boolean(file);

    // Business rule: Requires title
    if (!trimmedTitle) {
      if (file) {
        await this.storage.deleteFile(file.filename);
      }
      throw new ValidationError('Title is required', {
        title: ['Title is required and cannot be empty'],
      });
    }

    // Business rule: Requires at least one of file or textContent
    if (!hasText && !hasFile) {
      if (file) {
        await this.storage.deleteFile(file.filename);
      }
      throw new ValidationError(
        'Submission requires at least one of text content or an attached file',
        {
          content: ['Please provide either text content or upload a file (or both)'],
        }
      );
    }

    try {
      const doc = await this.repository.create({
        title: trimmedTitle,
        description: description ? description.trim() : null,
        textContent: hasText ? trimmedText : null,
        filePath: file ? file.filename : null,
        originalFilename: file ? file.originalname : null,
        mimeType: file ? file.mimetype : null,
        fileSize: file ? file.size : null,
        status: 'pending',
        submitterId,
      });

      return this.formatDocument(doc);
    } catch (error) {
      // Clean up uploaded file if database persistence fails
      if (file) {
        await this.storage.deleteFile(file.filename);
      }
      throw error;
    }
  }

  /**
   * Lists documents with role-based visibility and pagination.
   * Submitter: only views own documents.
   * Reviewer: views all documents.
   *
   * @param {object} params
   * @param {object} params.user - Authenticated user.
   * @param {'pending' | 'approved' | 'rejected'} [params.status] - Optional status filter.
   * @param {number} [params.page=1]
   * @param {number} [params.pageSize=10]
   * @returns {Promise<{ data: object[], pagination: { page: number, pageSize: number, total: number, totalPages: number } }>}
   */
  async listDocuments({ user, status, page = 1, pageSize = 10 }) {
    const where = {};

    // Submitter isolation
    if (user.role === 'submitter') {
      where.submitterId = user.id;
    }

    // Filter by status if specified
    if (status) {
      where.status = status;
    }

    const currentPage = Math.max(1, Number(page) || 1);
    const limit = Math.min(50, Math.max(1, Number(pageSize) || 10));
    const skip = (currentPage - 1) * limit;

    const { items, total } = await this.repository.findManyWithPagination({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      data: items.map(doc => this.formatDocument(doc)),
      pagination: {
        page: currentPage,
        pageSize: limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Retrieves single document detail.
   * Enforces submitter privacy: requesting another user's document returns 404 (not 403)
   * to avoid leaking resource existence.
   *
   * @param {object} params
   * @param {string} params.id - Document UUID.
   * @param {object} params.user - Authenticated user.
   * @returns {Promise<object>} Formatted document response.
   */
  async getDocumentById({ id, user }) {
    if (!isValidUuid(id)) {
      throw new NotFoundError('Document not found');
    }

    const doc = await this.repository.findById(id);
    if (!doc) {
      throw new NotFoundError('Document not found');
    }

    // Submitter can only access own documents (404, not 403, to prevent leaking existence)
    if (user.role === 'submitter' && doc.submitterId !== user.id) {
      throw new NotFoundError('Document not found');
    }

    return this.formatDocument(doc);
  }

  /**
   * Retrieves file stream for authorized download.
   * Applies the exact same visibility rules as detail retrieval.
   *
   * @param {object} params
   * @param {string} params.id - Document UUID.
   * @param {object} params.user - Authenticated user.
   * @returns {Promise<{ stream: import('stream').Readable, filename: string, mimeType: string, size: number }>}
   */
  async getDocumentFileStream({ id, user }) {
    if (!isValidUuid(id)) {
      throw new NotFoundError('Document not found');
    }

    const doc = await this.repository.findById(id);
    if (!doc) {
      throw new NotFoundError('Document not found');
    }

    if (user.role === 'submitter' && doc.submitterId !== user.id) {
      throw new NotFoundError('Document not found');
    }

    if (!doc.filePath) {
      throw new NotFoundError('Document does not have an attached file');
    }

    const stream = await this.storage.getFileStream(doc.filePath);

    return {
      stream,
      filename: doc.originalFilename || 'document-file',
      mimeType: doc.mimeType || 'application/octet-stream',
      size: doc.fileSize || 0,
    };
  }

  /**
   * State Machine Status Transition (pending -> approved | rejected).
   * Executes an atomic updateMany conditional on `status === 'pending'`.
   * If update count is 0, checks if document exists to distinguish between 404 and 409.
   *
   * @param {object} params
   * @param {string} params.id - Document UUID.
   * @param {object} params.user - Authenticated reviewer user.
   * @param {'approved' | 'rejected'} params.status - Target decision.
   * @param {string} [params.comment] - Optional review comment.
   * @returns {Promise<object>} Formatted updated document.
   */
  async updateDocumentStatus({ id, user, status, comment }) {
    if (!isValidUuid(id)) {
      throw new NotFoundError('Document not found');
    }

    if (user.role !== 'reviewer') {
      throw new ValidationError('Only reviewers can review documents');
    }

    if (status !== 'approved' && status !== 'rejected') {
      throw new ValidationError('Status must be either "approved" or "rejected"');
    }

    const trimmedComment = comment ? comment.trim() : null;

    // Race-safe atomic update: only matches if status is currently 'pending'
    const updatedCount = await this.repository.atomicUpdateStatus({
      id,
      status,
      reviewerId: user.id,
      reviewedAt: new Date(),
      reviewComment: trimmedComment,
    });

    if (updatedCount === 0) {
      // Disambiguate between missing document (404) and illegal state transition (409)
      const existing = await this.repository.findById(id);
      if (!existing) {
        throw new NotFoundError('Document not found');
      }

      throw new ConflictError(
        `Document has already been decided (${existing.status}) and cannot be transitioned to ${status}`
      );
    }

    // Retrieve fresh document with reviewer relationship loaded
    const updatedDoc = await this.repository.findById(id);
    return this.formatDocument(updatedDoc);
  }

  /**
   * Formats database document entity for client response.
   * Never exposes internal filePath or passwordHash.
   *
   * @param {import('@prisma/client').Document} doc
   * @returns {object}
   */
  formatDocument(doc) {
    return {
      id: doc.id,
      title: doc.title,
      description: doc.description,
      textContent: doc.textContent,
      status: doc.status,
      submitter: doc.submitter
        ? {
            id: doc.submitter.id,
            name: doc.submitter.name,
          }
        : null,
      file: doc.filePath
        ? {
            originalFilename: doc.originalFilename,
            mimeType: doc.mimeType,
            size: doc.fileSize,
            downloadUrl: `/api/documents/${doc.id}/file`,
          }
        : null,
      reviewedBy: doc.reviewer
        ? {
            id: doc.reviewer.id,
            name: doc.reviewer.name,
          }
        : null,
      reviewedAt: doc.reviewedAt,
      reviewComment: doc.reviewComment,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
}

export const documentsService = new DocumentsService();
export default documentsService;
