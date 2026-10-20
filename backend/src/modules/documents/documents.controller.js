import { documentsService } from './documents.service.js';

/**
 * Controller handling document HTTP endpoints.
 * Thin presentation layer: parses HTTP requests and delegates to DocumentsService.
 */
export class DocumentsController {
  /**
   * Submits a document (multipart/form-data).
   */
  async create(req, res, next) {
    try {
      const { title, description, textContent } = req.body;
      const document = await documentsService.createDocument({
        submitterId: req.user.id,
        title,
        description,
        textContent,
        file: req.file,
      });

      res.status(201).json(document);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lists documents with pagination and role-based filtering.
   */
  async list(req, res, next) {
    try {
      const { status, page, pageSize } = req.query;
      const result = await documentsService.listDocuments({
        user: req.user,
        status,
        page,
        pageSize,
      });

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves single document detail.
   */
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const document = await documentsService.getDocumentById({
        id,
        user: req.user,
      });

      res.status(200).json(document);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Streams attached document file for authorized download.
   */
  async downloadFile(req, res, next) {
    try {
      const { id } = req.params;
      const { stream, filename, mimeType, size } = await documentsService.getDocumentFileStream({
        id,
        user: req.user,
      });

      res.setHeader('Content-Type', mimeType);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${encodeURIComponent(filename)}"`
      );
      if (size > 0) {
        res.setHeader('Content-Length', size);
      }

      stream.pipe(res);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reviews and decides a document status (approved / rejected).
   */
  async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status, comment } = req.body;

      const updated = await documentsService.updateDocumentStatus({
        id,
        user: req.user,
        status,
        comment,
      });

      res.status(200).json(updated);
    } catch (error) {
      next(error);
    }
  }
}

export const documentsController = new DocumentsController();
export default documentsController;
