<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import { ChevronLeft, ChevronRight, X } from 'lucide-vue-next';
import type { GuitarImageDto } from '../types';

export default defineComponent({
  name: 'ImageLightbox',
  components: { ChevronLeft, ChevronRight, X },
  props: {
    images: {
      type: Array as PropType<GuitarImageDto[]>,
      required: true,
    },
    initialIndex: {
      type: Number,
      default: 0,
    },
    open: {
      type: Boolean,
      default: false,
    },
    guitarName: {
      type: String,
      default: '',
    },
  },
  emits: ['close'],
  data() {
    return {
      currentIndex: this.initialIndex,
    };
  },
  computed: {
    currentImageUrl(): string | null {
      return this.images[this.currentIndex]?.url ?? null;
    },
  },
  watch: {
    open(val: boolean): void {
      document.body.style.overflow = val ? 'hidden' : '';
      if (val) {
        this.currentIndex = this.initialIndex;
      }
    },
    initialIndex(val: number): void {
      this.currentIndex = val;
    },
  },
  mounted() {
    window.addEventListener('keydown', this.handleKeydown);
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.handleKeydown);
    document.body.style.overflow = '';
  },
  methods: {
    next(): void {
      if (this.images.length <= 1) return;
      this.currentIndex = (this.currentIndex + 1) % this.images.length;
    },
    prev(): void {
      if (this.images.length <= 1) return;
      this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
    },
    handleKeydown(e: KeyboardEvent): void {
      if (!this.open) return;
      if (e.key === 'ArrowRight') this.next();
      else if (e.key === 'ArrowLeft') this.prev();
      else if (e.key === 'Escape') this.$emit('close');
    },
  },
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
    >
      <!-- Backdrop -->
      <div class="absolute inset-0" @click="$emit('close')" />

      <!-- Image -->
      <div class="bg-white p-10">
        <img
          v-if="currentImageUrl"
          :src="currentImageUrl"
          :alt="guitarName"
          class="relative z-10 max-w-[90vw] max-h-[90vh] object-contain select-none"
        />
      </div>

      <!-- Close button -->
      <button
        type="button"
        class="absolute z-20 top-4 right-4 rounded-full bg-white/10 text-white p-2 hover:bg-white/25 transition-colors"
        aria-label="Close image viewer"
        @click="$emit('close')"
      >
        <X class="h-5 w-5" />
      </button>

      <!-- Prev arrow -->
      <button
        v-if="images.length > 1"
        type="button"
        class="absolute z-20 left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 text-white p-3 hover:bg-white/25 transition-colors"
        aria-label="Previous image"
        @click="prev"
      >
        <ChevronLeft class="h-6 w-6" />
      </button>

      <!-- Next arrow -->
      <button
        v-if="images.length > 1"
        type="button"
        class="absolute z-20 right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 text-white p-3 hover:bg-white/25 transition-colors"
        aria-label="Next image"
        @click="next"
      >
        <ChevronRight class="h-6 w-6" />
      </button>

      <!-- Image counter -->
      <div
        v-if="images.length > 1"
        class="absolute z-20 bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm tabular-nums"
      >
        {{ currentIndex + 1 }} / {{ images.length }}
      </div>
    </div>
  </Teleport>
</template>
