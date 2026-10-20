/**
 * Base Application Error class.
 * All custom application errors inherit from this class.
 */
export class AppError extends Error {
  /**
   * @param {string} message - Human-readable error message.
   * @param {number} statusCode - HTTP status code.
   * @param {string} code - Machine-readable error code.
   * @param {Record<string, string[]>|null} [details=null] - Optional structured validation or contextual details.
   */
  constructor(message, statusCode = 500, code = 'internal_error', details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  /**
   * @param {string} [message='Validation failed']
   * @param {Record<string, string[]>} [details={}]
   */
  constructor(message = 'Validation failed', details = {}) {
    super(message, 400, 'validation_error', details);
  }
}

export class UnauthorizedError extends AppError {
  /**
   * @param {string} [message='Unauthorized']
   */
  constructor(message = 'Unauthorized') {
    super(message, 401, 'unauthorized');
  }
}

export class ForbiddenError extends AppError {
  /**
   * @param {string} [message='Forbidden']
   */
  constructor(message = 'Forbidden') {
    super(message, 403, 'forbidden');
  }
}

export class NotFoundError extends AppError {
  /**
   * @param {string} [message='Resource not found']
   */
  constructor(message = 'Resource not found') {
    super(message, 404, 'not_found');
  }
}

export class ConflictError extends AppError {
  /**
   * @param {string} [message='Invalid state transition']
   */
  constructor(message = 'Invalid state transition') {
    super(message, 409, 'invalid_transition');
  }
}

export class PayloadTooLargeError extends AppError {
  /**
   * @param {string} [message='File size exceeds limit']
   */
  constructor(message = 'File size exceeds limit') {
    super(message, 413, 'file_too_large');
  }
}

export class UnsupportedMediaTypeError extends AppError {
  /**
   * @param {string} [message='Unsupported media type']
   */
  constructor(message = 'Unsupported media type') {
    super(message, 415, 'unsupported_file_type');
  }
}

export class RateLimitError extends AppError {
  /**
   * @param {string} [message='Too many requests']
   */
  constructor(message = 'Too many requests') {
    super(message, 429, 'rate_limited');
  }
}

export class InternalError extends AppError {
  /**
   * @param {string} [message='An internal server error occurred']
   */
  constructor(message = 'An internal server error occurred') {
    super(message, 500, 'internal_error');
  }
}
