import { createApp } from './app';
import { config } from './config/env';
import { initDb, closeDb } from './db/pool';
import { initScheduler } from './services/scheduler.service';

async function startServer() {
  // Connect to database (PostgreSQL with graceful fallback)
  await initDb();

  // Initialize background tasks
  initScheduler();

  const app = createApp();
  const server = app.listen(config.port, () => {
    console.log(`=========================================`);
    console.log(`  ORBIT — Personal Work OS API Server     `);
    console.log(`  Environment: ${config.nodeEnv}          `);
    console.log(`  Listening on: http://localhost:${config.port}`);
    console.log(`  Health Check: http://localhost:${config.port}/health`);
    console.log(`=========================================`);
  });

  // Graceful shutdown handling
  const gracefulShutdown = async (signal: string) => {
    console.log(`\n[Process] Received ${signal}. Initiating graceful shutdown...`);
    server.close(async () => {
      console.log('[Server] HTTP server stopped accepting connections.');
      await closeDb();
      console.log('[Database] Database connections closed.');
      process.exit(0);
    });

    // Force close after 10s
    setTimeout(() => {
      console.error('[Process] Forcing exit after timeout.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

startServer().catch((err) => {
  console.error('[Fatal Startup Error]', err);
  process.exit(1);
});
