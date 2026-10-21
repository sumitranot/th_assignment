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

  // Security headers with Swagger CDN allowed
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdnjs.cloudflare.com'],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://cdnjs.cloudflare.com'],
          imgSrc: ["'self'", 'data:', 'https://validator.swagger.io'],
        },
      },
    })
  );

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

    app.get(['/api/docs.json', '/api/openapi.json'], (_req, res) => {
      res.status(200).json(swaggerDoc);
    });

    app.get('/api/docs', (_req, res) => res.redirect(301, '/api/docs/'));
    app.get('/docs', (_req, res) => res.redirect(301, '/api/docs/'));

    const swaggerOptions = {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'Document Approval Workflow API Docs',
      customCssUrl: 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.18.2/swagger-ui.min.css',
      customJs: [
        'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.18.2/swagger-ui-bundle.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.18.2/swagger-ui-standalone-preset.min.js',
      ],
    };

    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc, swaggerOptions));
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc, swaggerOptions));
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
