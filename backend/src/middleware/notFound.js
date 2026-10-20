import { NotFoundError } from '../lib/errors.js';

/**
 * 404 handler for unmatched routes.
 */
export const notFound = (req, _res, next) => {
  next(new NotFoundError(`Route not found: ${req.method} ${req.originalUrl}`));
};
