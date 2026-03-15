import type {
  GuitarListResponse,
  GuitarDetailDto,
  GuitarFilterParams,
} from '../types';

/**
 * Composable for interacting with the guitar REST API.
 */
export function useGuitarApi() {
  const config = useRuntimeConfig();
  const apiBase = config.public.apiBase;

  /**
   * Fetch paginated, filtered guitar list with facets.
   */
  async function fetchGuitars(
    params: GuitarFilterParams,
  ): Promise<GuitarListResponse> {
    const query = buildQueryString(params);
    const url = `${apiBase}/guitars${query ? `?${query}` : ''}`;

    const response = await $fetch<GuitarListResponse>(url);
    return response;
  }

  /**
   * Fetch a single guitar by ID.
   */
  async function fetchGuitar(id: string): Promise<GuitarDetailDto> {
    return $fetch<GuitarDetailDto>(`${apiBase}/guitars/${id}`);
  }

  return { fetchGuitars, fetchGuitar };
}

/** Build a query string from filter params, handling arrays properly. */
function buildQueryString(params: GuitarFilterParams): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;

    if (Array.isArray(value)) {
      if (value.length > 0) {
        searchParams.set(key, value.join(','));
      }
    } else if (typeof value === 'boolean') {
      searchParams.set(key, String(value));
    } else {
      searchParams.set(key, String(value));
    }
  }

  return searchParams.toString();
}
