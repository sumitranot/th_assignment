import crypto from 'crypto';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { env } from '../config/env.js';
import { PayloadTooLargeError, UnsupportedMediaTypeError, ValidationError } from '../lib/errors.js';

export const ALLOWED_EXTENSIONS = ['.pdf', '.txt', '.md', '.doc', '.docx', '.png', '.jpg', '.jpeg'];

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'text/plain',
  'text/markdown',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
];

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadDir = path.resolve(env.UPLOAD_DIR);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const uuid = crypto.randomUUID();
    cb(null, `${uuid}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname || '').toLowerCase();
  const mime = (file.mimetype || '').toLowerCase();

  // Validate extension
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(
      new UnsupportedMediaTypeError(
        `File extension "${ext}" is not allowed. Supported formats: ${ALLOWED_EXTENSIONS.join(', ')}`
      )
    );
  }

  // Validate MIME type
  if (!ALLOWED_MIME_TYPES.includes(mime)) {
    return cb(
      new UnsupportedMediaTypeError(
        `MIME type "${mime}" is not allowed. Supported types: ${ALLOWED_MIME_TYPES.join(', ')}`
      )
    );
  }

  cb(null, true);
};

const multerUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.MAX_FILE_SIZE_BYTES, // 5 MB
    files: 1,
  },
}).single('file');

/**
 * Express middleware wrapping Multer with standardized error mapping
 * and empty file validation.
 */
export const uploadMiddleware = (req, res, next) => {
  multerUpload(req, res, err => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(
            new PayloadTooLargeError(
              `File exceeds the maximum allowed size of ${env.MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB`
            )
          );
        }
        return next(new ValidationError(`File upload error: ${err.message}`));
      }
      return next(err);
    }

    // Check for empty file if a file was uploaded
    if (req.file) {
      if (req.file.size === 0) {
        // Delete empty file from disk
        if (fs.existsSync(req.file.path)) {
          try {
            fs.unlinkSync(req.file.path);
          } catch {
            // Ignore cleanup error
          }
        }
        return next(
          new ValidationError('Uploaded file is empty', {
            file: ['Uploaded file cannot be 0 bytes'],
          })
        );
      }
    }

    next();
  });
};
