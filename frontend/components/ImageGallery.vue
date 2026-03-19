<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import { ImageOff, Maximize2 } from 'lucide-vue-next';
import type { GuitarImageDto } from '../types';

export default defineComponent({
  name: 'ImageGallery',
  components: { ImageOff, Maximize2 },
  props: {
    images: {
      type: Array as PropType<GuitarImageDto[]>,
      required: true,
    },
    guitarName: {
      type: String,
      required: true,
    },
  },
  emits: ['open-lightbox'],
  data() {
    return {
      selectedImageIndex: 0,
    };
  },
  computed: {
    selectedImage(): GuitarImageDto | null {
      return this.images[this.selectedImageIndex] ?? null;
    },
    selectedImageUrl(): string | null {
      return this.selectedImage?.url ?? null;
    },
  },
  methods: {
    selectImage(index: number): void {
      this.selectedImageIndex = index;
    },
    handleMainImageClick(): void {
      if (this.selectedImageUrl) {
        this.$emit('open-lightbox', this.selectedImageIndex);
      }
    },
  },
});
</script>

<template>
  <div>
    <!-- Main image -->
    <div
      class="aspect-square rounded-lg border bg-card overflow-hidden mb-3 group relative"
      :class="selectedImageUrl ? 'cursor-pointer' : ''"
      @click="handleMainImageClick"
    >
      <img
        v-if="selectedImage"
        :src="selectedImage.url"
        :alt="guitarName"
        class="w-full h-full object-contain"
      />
      <div
        v-else
        class="w-full h-full flex items-center justify-center text-muted-foreground/30"
      >
        <ImageOff class="h-24 w-24" :stroke-width="1" />
      </div>
      <!-- Zoom hint on hover -->
      <div
        v-if="selectedImageUrl"
        class="absolute inset-0 flex items-end justify-end p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
      >
        <div class="bg-black/50 rounded-full p-1.5">
          <Maximize2 class="h-4 w-4 text-white" />
        </div>
      </div>
    </div>

    <!-- Thumbnail strip -->
    <div v-if="images.length > 1" class="flex gap-2 overflow-x-auto pb-1">
      <button
        v-for="(img, idx) in images"
        :key="img.id"
        type="button"
        class="w-16 h-16 flex-shrink-0 rounded-md border-2 overflow-hidden transition-colors"
        :class="idx === selectedImageIndex
          ? 'border-primary ring-2 ring-ring ring-offset-2'
          : 'border-border hover:border-muted-foreground'"
        @click="selectImage(idx)"
      >
        <img
          :src="img.url"
          :alt="`${guitarName} image ${idx + 1}`"
          class="w-full h-full object-contain"
          loading="lazy"
        />
      </button>
    </div>
  </div>
</template>
