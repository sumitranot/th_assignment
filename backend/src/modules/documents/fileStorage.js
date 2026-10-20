import { diskStorage } from '../../storage/diskStorage.js';

/**
 * Storage service bridge for document attachments.
 * Can be swapped for an S3Storage adapter without changing business logic.
 */
export const fileStorage = diskStorage;
export default fileStorage;
