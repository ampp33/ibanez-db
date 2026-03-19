<script lang="ts">
import { defineComponent } from 'vue';
import { Search, X } from 'lucide-vue-next';
import { Input } from '~/components/ui/input';

/**
 * Search input with debounced text entry, using shadcn-vue styling.
 */
export default defineComponent({
  name: 'SearchBar',
  components: { Search, X, Input },
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
    handleInput(value: string | number): void {
      this.localValue = String(value);

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
    <Input
      :model-value="localValue"
      type="text"
      placeholder="Search guitars by model, series, or name..."
      class="pl-10 pr-10"
      @update:model-value="handleInput"
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
