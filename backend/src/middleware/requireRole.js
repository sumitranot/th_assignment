import { ForbiddenError } from '../lib/errors.js';

/**
 * Role-based authorization middleware factory.
 * @param {...string} allowedRoles - One or more roles allowed to access the endpoint.
 * @returns {import('express').RequestHandler}
 */
export const requireRole = (...allowedRoles) => {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new ForbiddenError('Access forbidden: user not authenticated'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Access forbidden: required role ${allowedRoles.join(' or ')}, but user has role ${req.user.role}`
        )
      );
    }

    next();
  };
};
