import { createApp } from './app';
import { config } from './config/env';
import { initDb, closeDb } from './db/pool';
import { initScheduler } from './services/scheduler.service';

let isStarting = false;
let isShuttingDown = false;

async function startServer() {
  if (isStarting) {
    console.warn('[Server] startServer() was invoked more than once. Skipping duplicate invocation.');
    return;
  }
  isStarting = true;

  try {
    // 1. Connect to database (PostgreSQL with resilient fallback)
    await initDb();

    // 2. Initialize background scheduler for deadline alerts
    initScheduler();

    // 3. Create Express application
    const app = createApp();

    // 4. Start HTTP Server
    const server = app.listen(config.port, () => {
      console.log(`=========================================`);
      console.log(`  ORBIT — Personal Work OS API Server     `);
      console.log(`  Environment: ${config.nodeEnv}          `);
      console.log(`  Listening on: http://localhost:${config.port}`);
      console.log(`  Health Check: http://localhost:${config.port}/health`);
      console.log(`=========================================`);
    });

    // 5. Intercept server errors (such as EADDRINUSE) gracefully
    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\n[Server Error] Port ${config.port} is already in use by another process.`);
        console.error(`[Server Error] Tip: Set a different PORT in server/.env (e.g. PORT=5001) or terminate the existing process.`);
      } else {
        console.error('\n[Server Fatal Socket Error]', err);
      }
      process.exit(1);
    });

    // 6. Graceful shutdown handler
    const gracefulShutdown = (signal: string) => {
      if (isShuttingDown) return;
      isShuttingDown = true;

      console.log(`\n[Process] Received ${signal}. Initiating graceful shutdown...`);

      // Stop accepting new connections
      server.close(async (closeErr) => {
        if (closeErr) {
          console.error('[Server Error] Error closing HTTP server:', closeErr);
        } else {
          console.log('[Server] HTTP server stopped accepting connections.');
        }

        try {
          await closeDb();
          console.log('[Database] Database connections closed.');
        } catch (dbErr: any) {
          console.error('[Database Error] Error closing database pool:', dbErr.message);
        }

        process.exit(0);
      });

      // Force close after 5 seconds if connections hang
      const forceTimer = setTimeout(() => {
        console.error('[Process] Forcing exit after shutdown timeout.');
        process.exit(1);
      }, 5000);
      forceTimer.unref();
    };

    process.once('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.once('SIGINT', () => gracefulShutdown('SIGINT'));
    process.once('SIGUSR2', () => gracefulShutdown('SIGUSR2'));
  } catch (err) {
    console.error('[Fatal Startup Error]', err);
    process.exit(1);
  }
}

startServer();
