/**
 * Storage interface abstraction.
 * Allows seamless switching between local disk storage and cloud storage providers (e.g. AWS S3).
 *
 * @interface StorageInterface
 */
export class StorageInterface {
  /**
   * Saves a file to the storage provider.
   * @param {object} file - The uploaded file object (e.g. from Multer).
   * @returns {Promise<{ storageKey: string, filePath: string, size: number, mimeType: string, originalFilename: string }>}
   */
  async saveFile(_file) {
    throw new Error('Method saveFile() must be implemented');
  }

  /**
   * Retrieves a readable stream for a stored file.
   * @param {string} storageKey - Internal storage key.
   * @returns {Promise<import('stream').Readable>}
   */
  async getFileStream(_storageKey) {
    throw new Error('Method getFileStream() must be implemented');
  }

  /**
   * Deletes a file from storage.
   * @param {string} storageKey - Internal storage key.
   * @returns {Promise<void>}
   */
  async deleteFile(_storageKey) {
    throw new Error('Method deleteFile() must be implemented');
  }

  /**
   * Checks whether a file exists in storage.
   * @param {string} storageKey
   * @returns {Promise<boolean>}
   */
  async fileExists(_storageKey) {
    throw new Error('Method fileExists() must be implemented');
  }
}
