/**
 * Backfill script: re-normalize bridge_type using the expanded BRIDGE_TYPE_MAP
 * and populate bridge_type_simple for all existing guitar records.
 *
 * Run with: npx tsx src/scripts/backfill-bridge-types.ts
 */
import { normalizeBridgeType, deriveBridgeTypeSimple } from '../adapters/scraper/field-normalizer';
import { runBackfill, runScript } from './backfill-runner';
import { logger } from '../config/logger';

runScript(() =>
  runBackfill(
    {
      name: 'bridge_type / bridge_type_simple',
      fields: ['id', 'model', 'bridgeType', 'bridgeTypeSimple', 'rawAttributes'],
    },
    async (guitars) => {
      let updated = 0;
      for (const guitar of guitars) {
        // Use raw_attributes for the most faithful source value
        const rawBridge = guitar.rawAttributes?.['Bridge']
          ?? guitar.rawAttributes?.['Bridge type']
          ?? guitar.rawAttributes?.['Tremolo']
          ?? guitar.bridgeType
          ?? null;

        const bridgeType = rawBridge ? normalizeBridgeType(rawBridge) : null;
        const bridgeTypeSimple = deriveBridgeTypeSimple(bridgeType);

        if (guitar.bridgeType !== bridgeType || guitar.bridgeTypeSimple !== bridgeTypeSimple) {
          if (guitar.bridgeType !== bridgeType) {
            logger.info(`  ${guitar.model}: bridge_type "${guitar.bridgeType}" → "${bridgeType}"`);
          }
          Object.assign(guitar, { bridgeType, bridgeTypeSimple });
          updated++;
        }
      }
      return updated;
    },
  ),
);
