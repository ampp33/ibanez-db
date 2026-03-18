/**
 * Core guitar domain types shared between backend and frontend.
 */

export type ProductCategory = 'guitar' | 'bass';

/** All known Ibanez series identifiers. */
export type GuitarSeries =
  | 'RG'
  | 'S'
  | 'JEM'
  | 'JS'
  | 'RGA'
  | 'AZ'
  | 'FR'
  | 'GRG'
  | 'GRX'
  | 'GRGR'
  | 'SA'
  | 'AR'
  | 'ART'
  | 'AS'
  | 'AM'
  | 'AF'
  | 'GB'
  | 'SR'
  | 'BTB'
  | 'GSR'
  | 'JIVA'
  | 'KIKO'
  | 'PIA'
  | 'TOD'
  | 'QX'
  | 'TQM'
  | 'PM'
  | 'LB'
  | 'MMN'
  | 'THBB'
  | 'RGDMS'
  | 'Q'
  | 'EH'
  | 'AZES'
  | string;

export type PickupConfiguration =
  | 'HSH'
  | 'HSS'
  | 'HH'
  | 'SSH'
  | 'SSS'
  | 'SS'
  | 'HS'
  | 'SH'
  | 'H'
  | 'S'
  | 'P90'
  | string;

export type BridgeType =
  | 'Edge'
  | 'Edge Zero'
  | 'Edge Zero II'
  | 'Edge III'
  | 'Lo-Pro Edge'
  | 'Lo-TRS II'
  | 'Zero Resistance'
  | 'Gibraltar Standard II'
  | 'Gibraltar'
  | 'Fixed'
  | 'Tight-End R'
  | 'Tight-End'
  | 'FAT-6'
  | 'AZ-1'
  | 'T1502'
  | 'Mono-rail'
  | string;

export interface GuitarDto {
  id: string;
  model: string;
  name: string;
  slug: string;
  productCategory: ProductCategory | null;
  series: string | null;
  bodyType: string | null;
  bodyMaterial: string | null;
  bodyMaterialList: string[];
  neckType: string | null;
  neckMaterial: string | null;
  neckMaterialList: string[];
  fretboardMaterial: string | null;
  fretboardMaterialList: string[];
  fretboardRadius: string | null;
  numberOfFrets: number | null;
  numberOfFretsList: number[];
  numberOfStrings: number | null;
  scaleLength: string | null;
  pickupConfiguration: string | null;
  pickupConfigurationList: string[];
  neckPickup: string | null;
  middlePickup: string | null;
  bridgePickup: string | null;
  bridgeType: string | null;
  tremolo: boolean | null;
  hardwareColor: string | null;
  finishes: string[];
  countryOfOrigin: string | null;
  countryOfOriginList: string[];
  yearsProduced: string | null;
  productionStart: number | null;
  productionEnd: number | null;
  msrp: string | null;
  wikiUrl: string | null;
  primaryImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GuitarImageDto {
  id: string;
  guitarId: string;
  storageKey: string;
  originalName: string;
  sizeBytes: number;
  mimeType: string;
  isPrimary: boolean;
  url: string;
  createdAt: string;
}

export interface GuitarDetailDto extends GuitarDto {
  images: GuitarImageDto[];
  /** HTML description scraped from the wiki article. */
  descriptionHtml: string | null;
  /** Raw key-value pairs scraped from the wiki infobox. */
  rawAttributes: Record<string, string>;
}
