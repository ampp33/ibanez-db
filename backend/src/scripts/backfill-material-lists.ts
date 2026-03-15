/**
 * One-time backfill script: populate body_material_list, neck_material_list,
 * and fretboard_material_list for all existing guitar records.
 *
 * Run with: npx ts-node -e "require('./src/scripts/backfill-material-lists.ts')"
 * Or: npx tsx src/scripts/backfill-material-lists.ts
 */
import { MikroORM } from '@mikro-orm/postgresql';
import ormConfig from '../mikro-orm.config';
import { Guitar } from '../domain/entities/Guitar';
import {
  extractBodyMaterialList,
  extractNeckMaterialList,
  extractFretboardMaterialList,
} from '../adapters/scraper/field-normalizer';
import { logger } from '../config/logger';

async function run(): Promise<void> {
  const orm = await MikroORM.init(ormConfig);
  const em = orm.em.fork();

  try {
    logger.info('Starting material list backfill...');

    const batchSize = 200;
    let offset = 0;
    let totalUpdated = 0;

    while (true) {
      const guitars = await em.find(Guitar, {}, {
        fields: ['id', 'model', 'bodyMaterial', 'neckMaterial', 'fretboardMaterial', 'rawAttributes'],
        limit: batchSize,
        offset,
        orderBy: { model: 'asc' },
      });

      if (guitars.length === 0) break;

      for (const guitar of guitars) {
        // Prefer raw_attributes values for more complete material info (multi-year variants)
        const rawBody = (guitar.rawAttributes?.['Body material'] ?? guitar.bodyMaterial ?? null);
        const rawNeck = (guitar.rawAttributes?.['Neck material'] ?? guitar.neckMaterial ?? null);
        const rawFretboard = (guitar.rawAttributes?.['Fingerboard material'] ?? guitar.fretboardMaterial ?? null);

        const bodyMaterialList = extractBodyMaterialList(rawBody);
        const neckMaterialList = extractNeckMaterialList(rawNeck);
        const fretboardMaterialList = extractFretboardMaterialList(rawFretboard);

        em.assign(guitar, { bodyMaterialList, neckMaterialList, fretboardMaterialList });
      }

      await em.flush();
      em.clear();

      totalUpdated += guitars.length;
      offset += batchSize;
      logger.info(`Backfilled ${totalUpdated} guitars...`);
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
