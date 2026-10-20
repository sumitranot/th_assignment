import { ValidationError } from '../lib/errors.js';

/**
 * Validates request data against Zod schemas for body, query, and/or params.
 * Formats errors into { fieldName: [message1, message2] }
 *
 * @param {{ body?: import('zod').ZodSchema, query?: import('zod').ZodSchema, params?: import('zod').ZodSchema }} schemas
 * @returns {import('express').RequestHandler}
 */
export const validate = schemas => {
  return (req, _res, next) => {
    const errorDetails = {};

    const targets = ['body', 'query', 'params'];
    for (const target of targets) {
      if (schemas[target]) {
        const result = schemas[target].safeParse(req[target]);
        if (!result.success) {
          result.error.errors.forEach(err => {
            const field = err.path.join('.') || target;
            if (!errorDetails[field]) {
              errorDetails[field] = [];
            }
            errorDetails[field].push(err.message);
          });
        } else {
          // Replace with sanitized/coerced data from Zod
          req[target] = result.data;
        }
      }
    }

    if (Object.keys(errorDetails).length > 0) {
      return next(new ValidationError('Request validation failed', errorDetails));
    }

    next();
  };
};
