import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import swaggerUi from 'swagger-ui-express';
import yaml from 'yaml';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import authRoutes from './modules/auth/auth.routes.js';
import documentsRoutes from './modules/documents/documents.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Creates and configures the Express application instance.
 * Does not call app.listen(), allowing Supertest to import and test it.
 */
export const createApp = () => {
  const app = express();

  // Security headers
  app.use(helmet());

  // CORS configuration
  app.use(
    cors({
      origin: env.CLIENT_ORIGIN,
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Request logging with Pino HTTP (redacts passwords and tokens)
  if (env.NODE_ENV !== 'test') {
    app.use(
      pinoHttp({
        logger,
        autoLogging: {
          ignore: req => req.url === '/api/health',
        },
      })
    );
  }

  // Body parsing
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  // Swagger Documentation endpoint
  const openApiPath = path.resolve(__dirname, '../openapi.yaml');
  if (fs.existsSync(openApiPath)) {
    const file = fs.readFileSync(openApiPath, 'utf8');
    const swaggerDoc = yaml.parse(file);
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));
  }

  // Authentication routes
  app.use('/api/auth', authRoutes);

  // Documents workflow routes
  app.use('/api/documents', documentsRoutes);

  // 404 handler for unknown routes
  app.use(notFound);

  // Global error handler
  app.use(errorHandler);

  return app;
};

export const app = createApp();
export default app;
