/**
 * One-time backfill script: recompute number_of_strings for all guitars using
 * the fixed isBassModel logic (avoids false positives like SRG matching SR).
 *
 * Run with: npx tsx src/scripts/backfill-number-of-strings.ts
 */
import { parseNumberOfStrings, isBassModel } from '../adapters/scraper/field-normalizer';
import { RAW_KEYS_FACTORY_TUNING } from '../adapters/scraper/guitar-mapper';
import { runBackfill, runScript } from './backfill-runner';
import { logger } from '../config/logger';

runScript(() =>
  runBackfill(
    {
      name: 'number_of_strings',
      fields: ['id', 'model', 'series', 'numberOfStrings', 'rawAttributes'],
    },
    async (guitars) => {
      let updated = 0;
      for (const guitar of guitars) {
        const raw = guitar.rawAttributes ?? {};
        const rawFactoryTuning = RAW_KEYS_FACTORY_TUNING.reduce<string | null>(
          (acc, key) => acc ?? (raw[key] ?? null),
          null,
        );

        let numberOfStrings = parseNumberOfStrings(rawFactoryTuning);
        if (numberOfStrings === null) {
          numberOfStrings = isBassModel(guitar.model, guitar.series) ? 4 : 6;
        }

        if (guitar.numberOfStrings !== numberOfStrings) {
          logger.info(`Updating ${guitar.model}: ${guitar.numberOfStrings} → ${numberOfStrings}`);
          Object.assign(guitar, { numberOfStrings });
          updated++;
        }
      }
      return updated;
    },
  ),
);
