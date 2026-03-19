import type { GuitarFacets } from '../types';

/** Facet category definitions for the filter sidebar. */
export const FACET_CATEGORIES: Array<{ field: keyof GuitarFacets; label: string }> = [
  { field: 'productCategory', label: 'Category' },
  { field: 'series', label: 'Series' },
  { field: 'numberOfStrings', label: 'Strings' },
  { field: 'bodyType', label: 'Body Type' },
  { field: 'neckType', label: 'Neck Type' },
  { field: 'pickupConfiguration', label: 'Pickup Config' },
  { field: 'bridgeType', label: 'Bridge' },
  { field: 'bodyMaterial', label: 'Body Material' },
  { field: 'neckMaterial', label: 'Neck Material' },
  { field: 'fretboardMaterial', label: 'Fretboard' },
  { field: 'countryOfOrigin', label: 'Country of Origin' },
  { field: 'numberOfFrets', label: 'Frets' },
];
