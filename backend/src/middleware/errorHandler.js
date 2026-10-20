import { AppError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';

/**
 * Global Express error handling middleware.
 * Ensures every error response conforms to the standardized envelope:
 * { "error": { "code": string, "message": string, "details"?: object } }
 */
export const errorHandler = (err, req, res, _next) => {
  // Handle JSON parse errors from express.json()
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: {
        code: 'validation_error',
        message: 'Malformed JSON payload in request body',
      },
    });
  }

  // Handle known application errors
  if (err instanceof AppError) {
    const errorBody = {
      code: err.code,
      message: err.message,
    };

    if (err.details && Object.keys(err.details).length > 0) {
      errorBody.details = err.details;
    }

    if (err.statusCode >= 500) {
      logger.error({ err, reqId: req.id, url: req.originalUrl }, 'Application 5xx error');
    }

    return res.status(err.statusCode).json({ error: errorBody });
  }

  // Handle unexpected unhandled errors (500)
  logger.error(
    {
      err: {
        message: err.message,
        stack: err.stack,
        name: err.name,
      },
      url: req.originalUrl,
      method: req.method,
    },
    'Unhandled server error'
  );

  return res.status(500).json({
    error: {
      code: 'internal_error',
      message: 'An unexpected internal server error occurred',
    },
  });
};
