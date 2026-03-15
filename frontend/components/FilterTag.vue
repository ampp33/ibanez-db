<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import { X } from 'lucide-vue-next';
import type { ActiveFilter } from '../types';

/**
 * A removable filter tag using shadcn-vue Badge styling.
 */
export default defineComponent({
  name: 'FilterTag',
  components: { X },
  props: {
    filter: {
      type: Object as PropType<ActiveFilter>,
      required: true,
    },
  },
  emits: ['remove'],
  methods: {
    handleRemove(): void {
      this.$emit('remove', this.filter);
    },
  },
});
</script>

<template>
  <div
    class="inline-flex items-center gap-1 rounded-full border bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground transition-colors"
  >
    <span class="text-muted-foreground">{{ filter.label }}:</span>
    <span>{{ filter.value }}</span>
    <button
      type="button"
      class="ml-0.5 rounded-full p-0.5 hover:bg-destructive/10 hover:text-destructive transition-colors"
      :aria-label="`Remove ${filter.label}: ${filter.value} filter`"
      @click="handleRemove"
    >
      <X class="h-3 w-3" />
    </button>
  </div>
</template>
