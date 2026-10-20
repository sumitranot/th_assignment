import app from '../backend/src/app.js';

/**
 * Serverless function entrypoint for Vercel.
 * Bridges incoming HTTP requests to the Express application.
 */
export default function handler(req, res) {
  return app(req, res);
}
