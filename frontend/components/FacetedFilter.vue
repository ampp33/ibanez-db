<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import { ChevronDown } from 'lucide-vue-next';
import type { FacetBucket } from '../types';

/**
 * A collapsible faceted filter category using shadcn-vue design tokens.
 * Displays checkboxes with counts in a Newegg-style layout.
 */
export default defineComponent({
  name: 'FacetedFilter',
  components: { ChevronDown },
  props: {
    label: {
      type: String,
      required: true,
    },
    field: {
      type: String,
      required: true,
    },
    buckets: {
      type: Array as PropType<FacetBucket[]>,
      default: () => [],
    },
    selected: {
      type: Array as PropType<string[]>,
      default: () => [],
    },
    startCollapsed: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update'],
  data() {
    return {
      isOpen: !this.startCollapsed,
      showAll: false,
    };
  },
  computed: {
    sortedBuckets(): FacetBucket[] {
      return [...this.buckets].sort((a, b) => a.value.localeCompare(b.value));
    },
    visibleBuckets(): FacetBucket[] {
      if (this.showAll) return this.sortedBuckets;
      return this.sortedBuckets.slice(0, 8);
    },
    hasMore(): boolean {
      return this.buckets.length > 8;
    },
    selectedCount(): number {
      return this.selected.length;
    },
  },
  methods: {
    toggle(): void {
      this.isOpen = !this.isOpen;
    },
    toggleValue(value: string): void {
      const current = [...this.selected];
      const idx = current.indexOf(value);
      if (idx >= 0) {
        current.splice(idx, 1);
      } else {
        current.push(value);
      }
      this.$emit('update', this.field, current);
    },
    isSelected(value: string): boolean {
      return this.selected.includes(value);
    },
  },
});
</script>

<template>
  <div class="border-b">
    <!-- Trigger -->
    <button
      type="button"
      class="flex w-full items-center justify-between py-3 text-sm font-medium transition-all hover:text-foreground"
      @click="toggle"
    >
      <span class="flex items-center gap-2">
        {{ label }}
        <span
          v-if="selectedCount > 0"
          class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground"
        >
          {{ selectedCount }}
        </span>
      </span>
      <ChevronDown
        class="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200"
        :class="{ 'rotate-180': isOpen }"
      />
    </button>

    <!-- Content -->
    <div
      v-show="isOpen"
      class="pb-3 space-y-1"
    >
      <div
        v-for="bucket in visibleBuckets"
        :key="bucket.value"
        class="flex items-center gap-2 rounded-sm px-1 py-1 text-sm cursor-pointer hover:bg-accent transition-colors"
        @click="toggleValue(bucket.value)"
      >
        <button
          type="button"
          class="peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 flex items-center justify-center transition-colors"
          :class="isSelected(bucket.value) ? 'bg-primary text-primary-foreground' : 'bg-background'"
          role="checkbox"
          :aria-checked="isSelected(bucket.value)"
        >
          <svg
            v-if="isSelected(bucket.value)"
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </button>
        <span class="flex-1 truncate">{{ bucket.value }}</span>
        <span class="text-xs tabular-nums text-muted-foreground">{{ bucket.count }}</span>
      </div>

      <button
        v-if="hasMore"
        type="button"
        class="text-xs text-muted-foreground hover:text-foreground transition-colors pl-1 pt-1 underline-offset-4 hover:underline"
        @click="showAll = !showAll"
      >
        {{ showAll ? 'Show less' : `Show all ${buckets.length}` }}
      </button>
    </div>
  </div>
</template>
