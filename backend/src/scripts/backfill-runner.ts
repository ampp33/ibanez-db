/**
 * Shared boilerplate for one-time backfill scripts.
 * Handles ORM init, batch iteration, flush/clear, and process exit.
 */
import { MikroORM } from '@mikro-orm/postgresql';
import ormConfig from '../mikro-orm.config';
import { Guitar } from '../domain/entities/Guitar';
import { logger } from '../config/logger';

export interface BackfillOptions {
  /** Human-readable name shown in log messages. */
  name: string;
  /** Fields to load for each guitar (always includes id and model). */
  fields?: (keyof Guitar)[];
}

/**
 * Run a backfill in 200-record batches.
 * The callback receives each batch and returns the count of updated records in that batch.
 */
export async function runBackfill(
  options: BackfillOptions,
  callback: (guitars: Guitar[]) => Promise<number>,
): Promise<void> {
  const orm = await MikroORM.init(ormConfig);
  const em = orm.em.fork();

  try {
    logger.info(`Starting ${options.name} backfill...`);

    const batchSize = 200;
    let offset = 0;
    let totalUpdated = 0;

    while (true) {
      const guitars = await em.find(Guitar, {}, {
        fields: options.fields ?? ['id', 'model', 'rawAttributes'] as (keyof Guitar)[],
        limit: batchSize,
        offset,
        orderBy: { model: 'asc' },
      });

      if (guitars.length === 0) break;

      const updatedInBatch = await callback(guitars);
      totalUpdated += updatedInBatch;

      await em.flush();
      em.clear();

      offset += batchSize;
      logger.info(`Backfilled ${offset} guitars (${totalUpdated} updated so far)...`);
    }

    logger.info(`Backfill complete: ${totalUpdated} guitars updated.`);
  } finally {
    await orm.close();
  }
}

/** Wrap a `runBackfill` call as a standalone script entry point. */
export function runScript(fn: () => Promise<void>): void {
  fn()
    .then(() => process.exit(0))
    .catch((err) => {
      logger.error({ err }, 'Backfill failed');
      process.exit(1);
    });
}
