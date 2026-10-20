import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '../../config/env.js';
import { authenticate } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import { authController } from './auth.controller.js';
import { loginSchema } from './auth.schema.js';

const router = Router();

// Rate limiter for login endpoint (login only, as required by spec)
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.NODE_ENV === 'test' ? 1000 : 15, // High limit in test, 15 in prod/dev
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      error: {
        code: 'rate_limited',
        message: 'Too many login attempts. Please try again later.',
      },
    });
  },
});

router.post(
  '/login',
  loginRateLimiter,
  validate(loginSchema),
  authController.login.bind(authController)
);

router.get('/me', authenticate, authController.getMe.bind(authController));

export default router;
