<script lang="ts">
import { defineComponent } from 'vue';
import { Search, X } from 'lucide-vue-next';

/**
 * Search input with debounced text entry, using shadcn-vue styling.
 */
export default defineComponent({
  name: 'SearchBar',
  components: { Search, X },
  props: {
    modelValue: {
      type: String,
      default: '',
    },
  },
  emits: ['update:modelValue'],
  data() {
    return {
      localValue: this.modelValue,
      debounceTimer: null as ReturnType<typeof setTimeout> | null,
    };
  },
  watch: {
    modelValue(newVal: string): void {
      this.localValue = newVal;
    },
  },
  beforeUnmount() {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
  },
  methods: {
    handleInput(event: Event): void {
      const target = event.target as HTMLInputElement;
      this.localValue = target.value;

      if (this.debounceTimer) clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        this.$emit('update:modelValue', this.localValue);
      }, 300);
    },
    handleClear(): void {
      this.localValue = '';
      this.$emit('update:modelValue', '');
    },
  },
});
</script>

<template>
  <div class="relative">
    <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    <input
      type="text"
      :value="localValue"
      placeholder="Search guitars by model, series, or name..."
      class="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-10 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      @input="handleInput"
    />
    <button
      v-if="localValue"
      type="button"
      class="absolute right-3 top-1/2 -translate-y-1/2 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      @click="handleClear"
    >
      <X class="h-4 w-4" />
    </button>
  </div>
</template>
