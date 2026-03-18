/**
 * One-time backfill script: recompute number_of_strings for all guitars using
 * the fixed isBassModel logic (avoids false positives like SRG matching SR).
 *
 * Run with: npx tsx src/scripts/backfill-number-of-strings.ts
 */
import { MikroORM } from '@mikro-orm/postgresql';
import ormConfig from '../mikro-orm.config';
import { Guitar } from '../domain/entities/Guitar';
import { parseNumberOfStrings, isBassModel } from '../adapters/scraper/field-normalizer';
import { logger } from '../config/logger';

async function run(): Promise<void> {
  const orm = await MikroORM.init(ormConfig);
  const em = orm.em.fork();

  try {
    logger.info('Starting number_of_strings backfill...');

    const batchSize = 200;
    let offset = 0;
    let totalUpdated = 0;

    while (true) {
      const guitars = await em.find(Guitar, {}, {
        fields: ['id', 'model', 'series', 'numberOfStrings', 'rawAttributes'],
        limit: batchSize,
        offset,
        orderBy: { model: 'asc' },
      });

      if (guitars.length === 0) break;

      for (const guitar of guitars) {
        const raw = guitar.rawAttributes ?? {};
        const rawFactoryTuning =
          raw['Factory tuning'] ?? raw['Strings (factory)'] ?? raw['String gauge (factory)'] ?? null;

        let numberOfStrings = parseNumberOfStrings(rawFactoryTuning);
        if (numberOfStrings === null) {
          numberOfStrings = isBassModel(guitar.model, guitar.series) ? 4 : 6;
        }

        if (guitar.numberOfStrings !== numberOfStrings) {
          logger.info(`Updating ${guitar.model}: ${guitar.numberOfStrings} → ${numberOfStrings}`);
          em.assign(guitar, { numberOfStrings });
          totalUpdated++;
        }
      }

      await em.flush();
      em.clear();

      offset += batchSize;
    }

    logger.info(`Backfill complete: ${totalUpdated} guitars updated.`);
  } finally {
    await orm.close();
  }
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    logger.error({ err }, 'Backfill failed');
    process.exit(1);
  });
