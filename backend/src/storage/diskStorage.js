import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { env } from '../config/env.js';
import { logger } from '../lib/logger.js';
import { StorageInterface } from './storageInterface.js';

/**
 * Local disk implementation of StorageInterface.
 * Stores files with a randomized UUID on disk to prevent path traversal and collision.
 */
export class DiskStorage extends StorageInterface {
  /**
   * @param {string} [uploadDir] - Base upload directory path.
   */
  constructor(uploadDir = env.UPLOAD_DIR) {
    super();
    this.uploadDir = path.resolve(uploadDir);
    this.ensureDirectoryExists();
  }

  ensureDirectoryExists() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Generates a unique UUID storage key with the file extension.
   * @param {string} originalFilename
   * @returns {string}
   */
  generateStorageKey(originalFilename) {
    const ext = path.extname(originalFilename || '').toLowerCase();
    const uuid = crypto.randomUUID();
    return `${uuid}${ext}`;
  }

  /**
   * Saves a buffer or file to disk.
   * @param {object} file - Express/Multer file object.
   * @returns {Promise<{ storageKey: string, filePath: string, size: number, mimeType: string, originalFilename: string }>}
   */
  async saveFile(file) {
    this.ensureDirectoryExists();
    const storageKey = this.generateStorageKey(file.originalname);
    const destinationPath = path.join(this.uploadDir, storageKey);

    if (file.path) {
      // If multer diskStorage already wrote to disk at a temp path, rename/move it
      await fs.promises.rename(file.path, destinationPath);
    } else if (file.buffer) {
      // If memory storage was used
      await fs.promises.writeFile(destinationPath, file.buffer);
    } else {
      throw new Error('Unsupported file object passed to saveFile');
    }

    const stat = await fs.promises.stat(destinationPath);

    return {
      storageKey,
      filePath: destinationPath,
      size: stat.size,
      mimeType: file.mimetype,
      originalFilename: file.originalname,
    };
  }

  /**
   * Returns a readable stream for a stored file.
   * @param {string} storageKey
   * @returns {Promise<fs.ReadStream>}
   */
  async getFileStream(storageKey) {
    const resolvedPath = path.join(this.uploadDir, path.basename(storageKey));
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`File not found: ${storageKey}`);
    }
    return fs.createReadStream(resolvedPath);
  }

  /**
   * Deletes a file from disk.
   * @param {string} storageKey
   * @returns {Promise<void>}
   */
  async deleteFile(storageKey) {
    if (!storageKey) return;
    try {
      const resolvedPath = path.join(this.uploadDir, path.basename(storageKey));
      if (fs.existsSync(resolvedPath)) {
        await fs.promises.unlink(resolvedPath);
      }
    } catch (err) {
      logger.warn({ err, storageKey }, 'Failed to delete file from disk storage');
    }
  }

  /**
   * Checks if file exists on disk.
   * @param {string} storageKey
   * @returns {Promise<boolean>}
   */
  async fileExists(storageKey) {
    if (!storageKey) return false;
    const resolvedPath = path.join(this.uploadDir, path.basename(storageKey));
    return fs.existsSync(resolvedPath);
  }
}

export const diskStorage = new DiskStorage();
export default diskStorage;
