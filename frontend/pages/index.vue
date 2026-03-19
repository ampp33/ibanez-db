<script lang="ts">
import { defineComponent } from 'vue';
import { SlidersHorizontal, Search, X } from 'lucide-vue-next';
import type {
  GuitarDto,
  GuitarFacets,
  GuitarFilterParams,
  ActiveFilter,
  FacetBucket,
} from '../types';
import { FACET_CATEGORIES } from '../config/facets';

export default defineComponent({
  name: 'SearchPage',
  components: { SlidersHorizontal, Search, X },
  setup() {
    const { fetchGuitars } = useGuitarApi();
    return { fetchGuitars };
  },
  data() {
    return {
      guitars: [] as GuitarDto[],
      facets: {} as Partial<GuitarFacets>,
      filters: {} as Record<string, string[]>,
      search: '',
      page: 1,
      limit: 24,
      total: 0,
      totalPages: 0,
      loading: false,
      error: null as string | null,
      facetCategories: FACET_CATEGORIES,
    };
  },
  computed: {
    activeFilters(): ActiveFilter[] {
      const tags: ActiveFilter[] = [];
      for (const cat of this.facetCategories) {
        const selected = this.filters[cat.field] ?? [];
        for (const value of selected) {
          tags.push({ field: cat.field, label: cat.label, value });
        }
      }
      if (this.search) {
        tags.push({ field: 'search', label: 'Search', value: this.search });
      }
      return tags;
    },
    hasAnyFilters(): boolean {
      return this.activeFilters.length > 0;
    },
    filterParams(): GuitarFilterParams {
      const params: GuitarFilterParams = {
        page: this.page,
        limit: this.limit,
        sortBy: 'model',
        sortOrder: 'asc',
      };
      if (this.search) params.search = this.search;

      for (const cat of this.facetCategories) {
        const selected = this.filters[cat.field];
        if (selected && selected.length > 0) {
          (params as Record<string, unknown>)[cat.field] = selected;
        }
      }
      return params;
    },
  },
  watch: {
    filterParams: {
      handler(): void {
        this.loadGuitars();
      },
      deep: true,
    },
  },
  mounted() {
    this.loadGuitars();
  },
  methods: {
    async loadGuitars(): Promise<void> {
      this.loading = true;
      this.error = null;
      try {
        const result = await this.fetchGuitars(this.filterParams);
        this.guitars = result.data;
        this.facets = result.facets;
        this.total = result.pagination.total;
        this.totalPages = result.pagination.totalPages;
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Failed to load guitars';
      } finally {
        this.loading = false;
      }
    },
    handleFilterUpdate(field: string, values: string[]): void {
      this.filters = { ...this.filters, [field]: values };
      this.page = 1;
    },
    handleRemoveFilter(filter: ActiveFilter): void {
      if (filter.field === 'search') {
        this.search = '';
        return;
      }
      const current = [...(this.filters[filter.field] ?? [])];
      const idx = current.indexOf(filter.value);
      if (idx >= 0) {
        current.splice(idx, 1);
        this.filters = { ...this.filters, [filter.field]: current };
      }
      this.page = 1;
    },
    clearAllFilters(): void {
      this.filters = {};
      this.search = '';
      this.page = 1;
    },
    handleSearchUpdate(value: string): void {
      this.search = value;
      this.page = 1;
    },
    goToPage(p: number): void {
      if (p >= 1 && p <= this.totalPages) {
        this.page = p;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    getSelectedValues(field: string): string[] {
      return this.filters[field] ?? [];
    },
    getFacetBuckets(field: string): FacetBucket[] {
      return (this.facets as Record<string, FacetBucket[]>)[field] ?? [];
    },
  },
});
</script>

<template>
  <div class="container py-6">
    <!-- Search bar -->
    <div class="mb-6">
      <SearchBar :model-value="search" @update:model-value="handleSearchUpdate" />
    </div>

    <!-- Active filter tags -->
    <div v-if="hasAnyFilters" class="mb-4 flex flex-wrap items-center gap-2">
      <span class="text-sm text-muted-foreground">Active filters:</span>
      <FilterTag
        v-for="(filter, index) in activeFilters"
        :key="`${filter.field}-${filter.value}-${index}`"
        :filter="filter"
        @remove="handleRemoveFilter"
      />
      <button
        type="button"
        class="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 ml-2 transition-colors"
        @click="clearAllFilters"
      >
        Clear all
      </button>
    </div>

    <div class="flex gap-8">
      <!-- Filter sidebar -->
      <aside class="w-64 flex-shrink-0 hidden lg:block">
        <div class="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
          <div class="flex items-center gap-2 mb-3">
            <SlidersHorizontal class="h-4 w-4 text-muted-foreground" />
            <h2 class="text-sm font-semibold tracking-tight">Filters</h2>
          </div>
          <FacetedFilter
            v-for="cat in facetCategories"
            :key="cat.field"
            :label="cat.label"
            :field="cat.field"
            :buckets="getFacetBuckets(cat.field)"
            :selected="getSelectedValues(cat.field)"
            :start-collapsed="false"
            @update="handleFilterUpdate"
          />
        </div>
      </aside>

      <!-- Results grid -->
      <div class="flex-1 min-w-0">
        <!-- Results count -->
        <div class="flex items-center justify-between mb-4">
          <p class="text-sm text-muted-foreground">
            <template v-if="loading">Loading...</template>
            <template v-else>
              {{ total }} guitar{{ total === 1 ? '' : 's' }} found
            </template>
          </p>
        </div>

        <!-- Error state -->
        <div
          v-if="error"
          class="rounded-lg border border-destructive/50 bg-destructive/10 p-4 mb-4"
        >
          <p class="text-sm text-destructive">{{ error }}</p>
        </div>

        <!-- Loading skeleton -->
        <div
          v-if="loading"
          class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
        >
          <GuitarCardSkeleton v-for="i in 6" :key="i" />
        </div>

        <!-- Guitar grid -->
        <div
          v-else-if="guitars.length > 0"
          class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
        >
          <GuitarCard
            v-for="guitar in guitars"
            :key="guitar.id"
            :guitar="guitar"
          />
        </div>

        <!-- Empty state -->
        <div
          v-else-if="!loading"
          class="flex flex-col items-center justify-center py-16 text-center"
        >
          <div class="rounded-full bg-muted p-4 mb-4">
            <Search class="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 class="text-lg font-semibold tracking-tight">No guitars found</h3>
          <p class="mt-1 text-sm text-muted-foreground max-w-sm">
            Try adjusting your filters or search terms to find what you're looking for.
          </p>
          <button
            v-if="hasAnyFilters"
            type="button"
            class="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            @click="clearAllFilters"
          >
            Clear all filters
          </button>
        </div>

        <!-- Pagination -->
        <PaginationBar
          v-if="totalPages > 1"
          :page="page"
          :total-pages="totalPages"
          @go-to-page="goToPage"
        />
      </div>
    </div>
  </div>
</template>
