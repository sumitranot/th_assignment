import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { requireRole } from '../../middleware/requireRole.js';
import { uploadMiddleware } from '../../middleware/upload.js';
import { validate } from '../../middleware/validate.js';
import { documentsController } from './documents.controller.js';
import {
  createDocumentSchema,
  listDocumentsSchema,
  updateStatusSchema,
} from './documents.schema.js';

const router = Router();

// All document routes require authentication
router.use(authenticate);

// POST /api/documents - Submitter only, multipart upload
router.post(
  '/',
  requireRole('submitter'),
  uploadMiddleware,
  validate(createDocumentSchema),
  documentsController.create.bind(documentsController)
);

// GET /api/documents - Submitter sees own, Reviewer sees all
router.get('/', validate(listDocumentsSchema), documentsController.list.bind(documentsController));

// GET /api/documents/:id - Single document detail
router.get('/:id', documentsController.getById.bind(documentsController));

// GET /api/documents/:id/file - Authorized file download
router.get('/:id/file', documentsController.downloadFile.bind(documentsController));

// PATCH /api/documents/:id/status - Reviewer only status decision
router.patch(
  '/:id/status',
  requireRole('reviewer'),
  validate(updateStatusSchema),
  documentsController.updateStatus.bind(documentsController)
);

export default router;
