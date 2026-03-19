/**
 * API request/response types shared between backend and frontend.
 */

import type { GuitarDto, GuitarDetailDto, ProductCategory, BridgeTypeSimple } from './guitar';

// ---- Pagination ----

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ---- Guitar list (with faceted filters) ----

export interface GuitarFilterParams extends PaginationParams {
  search?: string;
  productCategory?: ProductCategory | ProductCategory[];
  series?: string | string[];
  bodyType?: string | string[];
  bodyMaterial?: string | string[];
  neckType?: string | string[];
  neckMaterial?: string | string[];
  fretboardMaterial?: string | string[];
  pickupConfiguration?: string | string[];
  bridgeType?: string | string[];
  bridgeTypeSimple?: BridgeTypeSimple | BridgeTypeSimple[];
  hardwareColor?: string | string[];
  countryOfOrigin?: string | string[];
  tremolo?: boolean;
  numberOfFrets?: number | number[];
  numberOfStrings?: number | number[];
  productionStart?: number;
  productionEnd?: number;
  /** Overlap range filter: matches guitars whose production period intersects [min, max]. */
  productionYearMin?: number;
  productionYearMax?: number;
  sortBy?: GuitarSortField;
  sortOrder?: 'asc' | 'desc';
}

export type GuitarSortField =
  | 'model'
  | 'series'
  | 'productionStart'
  | 'createdAt'
  | 'updatedAt';

/** A single facet bucket for filter UIs. */
export interface FacetBucket {
  value: string;
  count: number;
}

/** All available facets returned alongside guitar list results. */
export interface GuitarFacets {
  productCategory: FacetBucket[];
  series: FacetBucket[];
  bodyType: FacetBucket[];
  bodyMaterial: FacetBucket[];
  neckType: FacetBucket[];
  neckMaterial: FacetBucket[];
  fretboardMaterial: FacetBucket[];
  pickupConfiguration: FacetBucket[];
  bridgeType: FacetBucket[];
  bridgeTypeSimple: FacetBucket[];
  hardwareColor: FacetBucket[];
  countryOfOrigin: FacetBucket[];
  numberOfFrets: FacetBucket[];
  numberOfStrings: FacetBucket[];
}

export interface GuitarListResponse extends PaginatedResponse<GuitarDto> {
  facets: GuitarFacets;
}

// ---- Error ----

export interface ApiError {
  statusCode: number;
  error: string;
  message: string;
}
