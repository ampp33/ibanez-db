/**
 * Frontend-specific types.
 * Core data types are re-exported from @ibanez-db/shared.
 */
export type {
  GuitarDto,
  GuitarDetailDto,
  GuitarImageDto,
  GuitarFilterParams,
  GuitarListResponse,
  GuitarFacets,
  FacetBucket,
  GuitarDetailResponse,
  ApiError,
  PaginatedResponse,
} from '@ibanez-db/shared';

/** Represents an active filter displayed as a removable tag. */
export interface ActiveFilter {
  field: string;
  label: string;
  value: string;
}
