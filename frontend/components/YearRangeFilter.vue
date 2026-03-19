<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import { SliderRoot, SliderTrack, SliderRange, SliderThumb } from 'radix-vue';

export default defineComponent({
  name: 'YearRangeFilter',
  components: { SliderRoot, SliderTrack, SliderRange, SliderThumb },
  props: {
    min: { type: Number, required: true },
    max: { type: Number, required: true },
    modelValue: { type: Array as unknown as PropType<[number, number]>, required: true },
  },
  emits: ['update:modelValue'],
  data() {
    return {
      isOpen: true,
      // Tracks slider position during drag for live visual feedback.
      // The parent only receives the committed value on pointer release.
      localValue: [this.modelValue[0], this.modelValue[1]] as [number, number],
    };
  },
  watch: {
    // Sync local display when the parent resets or changes the value externally
    modelValue(val: [number, number]): void {
      this.localValue = [val[0], val[1]];
    },
  },
  computed: {
    isDefault(): boolean {
      return this.modelValue[0] === this.min && this.modelValue[1] === this.max;
    },
    rangeLabel(): string {
      const [lo, hi] = this.localValue;
      if (lo === this.min && hi === this.max) return 'All years';
      if (lo === hi) return String(lo);
      return `${lo} – ${hi}`;
    },
  },
  methods: {
    // Update local display only — does NOT trigger a search yet
    handleDrag(value: number[] | undefined): void {
      if (value) this.localValue = value as [number, number];
    },
    // Emit to parent (and trigger search) only when the user releases
    handleCommit(value: number[] | undefined): void {
      if (value) this.$emit('update:modelValue', value as [number, number]);
    },
    reset(): void {
      this.$emit('update:modelValue', [this.min, this.max] as [number, number]);
    },
    toggle(): void {
      this.isOpen = !this.isOpen;
    },
  },
});
</script>

<template>
  <div class="border-b">
    <!-- Trigger (matches FacetedFilter style) -->
    <button
      type="button"
      class="flex w-full items-center justify-between py-3 text-sm font-medium transition-all hover:text-foreground"
      @click="toggle"
    >
      <span class="flex items-center gap-2">
        Production Year
        <span
          v-if="!isDefault"
          class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground"
        >
          1
        </span>
      </span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200"
        :class="{ 'rotate-180': isOpen }"
        viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </button>

    <!-- Content -->
    <div v-show="isOpen" class="pb-4 px-1 space-y-3">
      <!-- Selected range label -->
      <div class="flex items-center justify-between text-xs text-muted-foreground">
        <span>{{ rangeLabel }}</span>
        <button
          v-if="!isDefault"
          type="button"
          class="underline underline-offset-4 hover:text-foreground transition-colors"
          @click="reset"
        >
          Reset
        </button>
      </div>

      <!-- Slider -->
      <SliderRoot
        :model-value="localValue"
        :min="min"
        :max="max"
        :step="1"
        class="relative flex w-full touch-none select-none items-center"
        @update:model-value="handleDrag"
        @value-commit="handleCommit"
      >
        <SliderTrack class="relative h-1.5 w-full grow overflow-hidden rounded-full bg-primary/20">
          <SliderRange class="absolute h-full bg-primary" />
        </SliderTrack>
        <SliderThumb
          aria-label="Minimum year"
          class="block h-4 w-4 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <SliderThumb
          aria-label="Maximum year"
          class="block h-4 w-4 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </SliderRoot>

      <!-- Min/Max year labels -->
      <div class="flex justify-between text-[11px] text-muted-foreground tabular-nums">
        <span>{{ min }}</span>
        <span>{{ max }}</span>
      </div>
    </div>
  </div>
</template>
