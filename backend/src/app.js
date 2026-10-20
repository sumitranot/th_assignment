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
      origin: (origin, callback) => {
        if (!origin || env.CLIENT_ORIGIN === '*' || origin === env.CLIENT_ORIGIN) {
          return callback(null, true);
        }
        const origins = env.CLIENT_ORIGIN.split(',').map(s => s.trim());
        if (origins.includes(origin) || origin.endsWith('.vercel.app')) {
          return callback(null, true);
        }
        return callback(null, true);
      },
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
          ignore: req => req.url === '/api/health' || req.url === '/health',
        },
      })
    );
  }

  // Body parsing
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));

  // Health check endpoint
  app.get(['/api/health', '/health'], (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.get(['/api', '/'], (_req, res) => {
    res.status(200).json({ status: 'ok', message: 'Document Approval Workflow API' });
  });

  // Swagger Documentation endpoint
  const localOpenApiPath = path.resolve(__dirname, '../openapi.yaml');
  const rootOpenApiPath = path.resolve(process.cwd(), 'backend/openapi.yaml');
  const openApiPath = fs.existsSync(localOpenApiPath) ? localOpenApiPath : rootOpenApiPath;
  if (fs.existsSync(openApiPath)) {
    const file = fs.readFileSync(openApiPath, 'utf8');
    const swaggerDoc = yaml.parse(file);
    app.use(['/api/docs', '/docs'], swaggerUi.serve, swaggerUi.setup(swaggerDoc));
  }

  // Authentication routes
  app.use(['/api/auth', '/auth'], authRoutes);

  // Documents workflow routes
  app.use(['/api/documents', '/documents'], documentsRoutes);

  // 404 handler for unknown routes
  app.use(notFound);

  // Global error handler
  app.use(errorHandler);

  return app;
};

export const app = createApp();
export default app;
