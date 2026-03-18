import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config/app';
import { setLocale } from './app/middleware/i18n';
import { rateLimiter } from './app/middleware/rateLimiter';
import { errorHandler, notFoundHandler } from './app/middleware/errorHandler';
import router from './routes/index';

export function createApp(): Application {
  const app = express();

  // ── Security headers ────────────────────────────────────────────────────
  app.use(helmet());
  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (config.allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
    methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  }));

  // ── Body parsers ────────────────────────────────────────────────────────
  // Note: billing webhook route registers its own express.raw() before these
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  app.use(cookieParser() as any);

  // ── Locale detection ────────────────────────────────────────────────────
  app.use(setLocale);

  // ── Global rate limiter ─────────────────────────────────────────────────
  app.use('/api', rateLimiter);

  // ── Health check (unauthenticated) ──────────────────────────────────────
  app.get('/health', (_req, res) => res.json({ status: 'ok', env: config.nodeEnv }));

  // ── API routes ──────────────────────────────────────────────────────────
  app.use('/api', router);

  // ── 404 + error handlers ────────────────────────────────────────────────
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
