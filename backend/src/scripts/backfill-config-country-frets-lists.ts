/**
 * One-time backfill script: populate pickup_configuration_list,
 * country_of_origin_list, and number_of_frets_list for all existing guitar records.
 *
 * Run with: npx tsx src/scripts/backfill-config-country-frets-lists.ts
 */
import {
  extractPickupConfigurationList,
  extractCountryOfOriginList,
  extractNumberOfFretsList,
} from '../adapters/scraper/field-normalizer';
import { runBackfill, runScript } from './backfill-runner';

runScript(() =>
  runBackfill(
    {
      name: 'pickup/country/frets list',
      fields: ['id', 'model', 'pickupConfiguration', 'countryOfOrigin', 'numberOfFrets', 'rawAttributes'],
    },
    async (guitars) => {
      let updated = 0;
      for (const guitar of guitars) {
        const rawPickup = guitar.rawAttributes?.['Pickup configuration']
          ?? guitar.rawAttributes?.['Pickup config']
          ?? guitar.rawAttributes?.['Electronics']
          ?? guitar.pickupConfiguration
          ?? null;

        const rawCountry = guitar.rawAttributes?.['Country of origin']
          ?? guitar.rawAttributes?.['Country']
          ?? guitar.rawAttributes?.['Made in']
          ?? guitar.rawAttributes?.['Origin']
          ?? guitar.rawAttributes?.['Manufacturing']
          ?? guitar.countryOfOrigin
          ?? null;

        const rawFrets = guitar.rawAttributes?.['Frets']
          ?? guitar.rawAttributes?.['Number of frets']
          ?? guitar.rawAttributes?.['No. of frets']
          ?? (guitar.numberOfFrets != null ? String(guitar.numberOfFrets) : null);

        const pickupConfigurationList = extractPickupConfigurationList(rawPickup);
        const countryOfOriginList = extractCountryOfOriginList(rawCountry);
        const numberOfFretsList = extractNumberOfFretsList(rawFrets);

        Object.assign(guitar, { pickupConfigurationList, countryOfOriginList, numberOfFretsList });
        updated++;
      }
      return updated;
    },
  ),
);
