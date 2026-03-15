import Fastify from 'fastify';
import cors from '@fastify/cors';
import { MikroORM, type EntityManager } from '@mikro-orm/postgresql';
import { CronJob } from 'cron';
import ormConfig from './mikro-orm.config';
import { env } from './config/env';
import { logger } from './config/logger';
import { MinioStorageAdapter } from './adapters/storage/minio.adapter';
import { GuitarService } from './services/guitar.service';
import { guitarRoutes } from './api/routes/guitars';
import { healthRoutes } from './api/routes/health';
import { runScrape } from './jobs/scrape-guitars';

async function main(): Promise<void> {
  // Initialize MikroORM
  logger.info('Initializing database connection...');
  const orm = await MikroORM.init(ormConfig);

  // Run pending migrations
  const migrator = orm.getMigrator();
  const pendingMigrations = await migrator.getPendingMigrations();
  if (pendingMigrations.length > 0) {
    logger.info(`Running ${pendingMigrations.length} pending migrations...`);
    await migrator.up();
  }

  // Initialize storage
  const storage = new MinioStorageAdapter();
  await storage.ensureBucket();

  // Build Fastify server
  const fastify = Fastify({
    logger: false, // We use our own pino logger
  });

  // CORS
  await fastify.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  });

  // Fork EntityManager per request for proper unit-of-work isolation
  fastify.addHook('onRequest', async (request) => {
    (request as { em?: EntityManager }).em = orm.em.fork();
  });

  // Register routes
  await fastify.register(healthRoutes);
  await fastify.register(async (instance) => {
    const guitarService = new GuitarService(orm.em.fork(), storage);

    // Override service per-request with forked EM
    instance.addHook('onRequest', async (request) => {
      const em = (request as { em?: EntityManager }).em ?? orm.em.fork();
      (request as { guitarService?: GuitarService }).guitarService =
        new GuitarService(em, storage);
    });

    await instance.register(guitarRoutes, { guitarService });
  });

  // Schedule nightly scrape (runs at 2:00 AM daily)
  const cronJob = new CronJob('0 2 * * *', async () => {
    logger.info('Cron: Starting nightly scrape...');
    try {
      await runScrape();
    } catch (err) {
      logger.error({ err }, 'Cron: Scrape failed');
    }
  });
  cronJob.start();
  logger.info('Nightly scrape cron job scheduled (2:00 AM daily)');

  // Start server
  await fastify.listen({ host: env.server.host, port: env.server.port });
  logger.info(`Server listening on http://${env.server.host}:${env.server.port}`);

  // Graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`Received ${signal}, shutting down...`);
    cronJob.stop();
    await fastify.close();
    await orm.close();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  logger.error({ err }, 'Fatal startup error');
  process.exit(1);
});
