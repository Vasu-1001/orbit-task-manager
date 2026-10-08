import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { config } from './config/env';
import authRoutes from './routes/auth.routes';
import taskRoutes from './routes/task.routes';
import { errorHandler } from './middleware/error.middleware';
import { apiLimiter } from './middleware/rateLimit';
import { processUpcomingDeadlines } from './services/scheduler.service';

export function createApp(): Application {
  const app = express();

  // Security headers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false, // Allow development resources
    })
  );

  // CORS configuration — strict origin validation driven by environment
  const envOrigins = (config.clientUrl || '')
    .split(',')
    .map((url) => url.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  const localDevOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ];

  // In production, strictly restrict to configured production URLs.
  // In development, also permit standard local development origins.
  const allowedOrigins =
    config.nodeEnv === 'production'
      ? envOrigins
      : Array.from(new Set([...envOrigins, ...localDevOrigins]));

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, server-to-server, or test suites)
        if (!origin) {
          return callback(null, true);
        }

        const normalizedOrigin = origin.trim().replace(/\/+$/, '');
        if (allowedOrigins.includes(normalizedOrigin)) {
          return callback(null, true);
        }

        const corsError = new Error(`CORS policy violation: Origin '${origin}' is not authorized.`);
        (corsError as any).statusCode = 403;
        (corsError as any).name = 'Forbidden';
        return callback(corsError);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  // Body and cookie parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // General rate limiter
  app.use('/api', apiLimiter);

  // Health check endpoint
  app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: 'orbit-server',
    });
  });

  // Direct root endpoint bindings as specified in requirements (POST /register, POST /login)
  app.use('/', authRoutes);

  // API namespaced routes
  app.use('/api/auth', authRoutes);
  app.use('/auth', authRoutes);

  app.use('/api/tasks', taskRoutes);
  app.use('/tasks', taskRoutes);

  // Trigger deadline reminders (used for external cron services / serverless scheduled webhooks)
  app.post(['/api/jobs/reminders', '/jobs/reminders'], async (req: Request, res: Response) => {
    try {
      const cronSecret = process.env.CRON_SECRET;
      if (cronSecret) {
        const authHeader = req.headers.authorization;
        if (authHeader !== `Bearer ${cronSecret}`) {
          res.status(401).json({ error: 'Unauthorized', message: 'Invalid or missing cron secret.' });
          return;
        }
      }
      const delivered = await processUpcomingDeadlines();
      res.status(200).json({ message: 'Deadline reminders processed', delivered });
    } catch (err: any) {
      res.status(500).json({ error: 'InternalServerError', message: err.message });
    }
  });

  // 404 handler for undefined routes
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      error: 'NotFound',
      message: `The requested endpoint ${req.method} ${req.originalUrl} does not exist.`,
    });
  });

  // Centralized error handling middleware
  app.use(errorHandler);

  return app;
}
