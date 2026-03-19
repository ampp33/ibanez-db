/**
 * One-time backfill script: populate body_material_list, neck_material_list,
 * and fretboard_material_list for all existing guitar records.
 *
 * Run with: npx tsx src/scripts/backfill-material-lists.ts
 */
import {
  extractBodyMaterialList,
  extractNeckMaterialList,
  extractFretboardMaterialList,
} from '../adapters/scraper/field-normalizer';
import { runBackfill, runScript } from './backfill-runner';

runScript(() =>
  runBackfill(
    {
      name: 'material list',
      fields: ['id', 'model', 'bodyMaterial', 'neckMaterial', 'fretboardMaterial', 'rawAttributes'],
    },
    async (guitars) => {
      let updated = 0;
      for (const guitar of guitars) {
        const rawBody = guitar.rawAttributes?.['Body material'] ?? guitar.bodyMaterial ?? null;
        const rawNeck = guitar.rawAttributes?.['Neck material'] ?? guitar.neckMaterial ?? null;
        const rawFretboard = guitar.rawAttributes?.['Fingerboard material'] ?? guitar.fretboardMaterial ?? null;

        const bodyMaterialList = extractBodyMaterialList(rawBody);
        const neckMaterialList = extractNeckMaterialList(rawNeck);
        const fretboardMaterialList = extractFretboardMaterialList(rawFretboard);

        Object.assign(guitar, { bodyMaterialList, neckMaterialList, fretboardMaterialList });
        updated++;
      }
      return updated;
    },
  ),
);
