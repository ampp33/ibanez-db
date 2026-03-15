/**
 * One-time backfill script: populate pickup_configuration_list,
 * country_of_origin_list, and number_of_frets_list for all existing guitar records.
 *
 * Run with: npx tsx src/scripts/backfill-config-country-frets-lists.ts
 */
import { MikroORM } from '@mikro-orm/postgresql';
import ormConfig from '../mikro-orm.config';
import { Guitar } from '../domain/entities/Guitar';
import {
  extractPickupConfigurationList,
  extractCountryOfOriginList,
  extractNumberOfFretsList,
} from '../adapters/scraper/field-normalizer';
import { logger } from '../config/logger';

async function run(): Promise<void> {
  const orm = await MikroORM.init(ormConfig);
  const em = orm.em.fork();

  try {
    logger.info('Starting pickup/country/frets list backfill...');

    const batchSize = 200;
    let offset = 0;
    let totalUpdated = 0;

    while (true) {
      const guitars = await em.find(Guitar, {}, {
        fields: ['id', 'model', 'pickupConfiguration', 'countryOfOrigin', 'numberOfFrets', 'rawAttributes'],
        limit: batchSize,
        offset,
        orderBy: { model: 'asc' },
      });

      if (guitars.length === 0) break;

      for (const guitar of guitars) {
        // Pickup config: use raw_attributes for the most complete value
        const rawPickup = guitar.rawAttributes?.['Pickup configuration']
          ?? guitar.rawAttributes?.['Pickup config']
          ?? guitar.rawAttributes?.['Electronics']
          ?? guitar.pickupConfiguration
          ?? null;

        // Country: scalar is already normalized; use it directly for single-value list
        // Also check raw_attributes for completeness
        const rawCountry = guitar.rawAttributes?.['Country of origin']
          ?? guitar.rawAttributes?.['Country']
          ?? guitar.rawAttributes?.['Made in']
          ?? guitar.rawAttributes?.['Origin']
          ?? guitar.rawAttributes?.['Manufacturing']
          ?? guitar.countryOfOrigin
          ?? null;

        // Frets: use raw_attributes for the original string (handles "22/24" cases)
        const rawFrets = guitar.rawAttributes?.['Frets']
          ?? guitar.rawAttributes?.['Number of frets']
          ?? guitar.rawAttributes?.['No. of frets']
          ?? (guitar.numberOfFrets != null ? String(guitar.numberOfFrets) : null);

        const pickupConfigurationList = extractPickupConfigurationList(rawPickup);
        const countryOfOriginList = extractCountryOfOriginList(rawCountry);
        const numberOfFretsList = extractNumberOfFretsList(rawFrets);

        em.assign(guitar, { pickupConfigurationList, countryOfOriginList, numberOfFretsList });
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
