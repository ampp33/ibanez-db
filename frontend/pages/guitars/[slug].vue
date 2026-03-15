<script lang="ts">
import { defineComponent } from 'vue';
import { ArrowLeft, ChevronLeft, ChevronRight, ExternalLink, ImageOff, Maximize2, X } from 'lucide-vue-next';
import type { GuitarDetailDto, GuitarImageDto } from '../../types';

/** Spec table fields to display in order. */
const SPEC_FIELDS: Array<{ key: keyof GuitarDetailDto; label: string }> = [
  { key: 'series', label: 'Series' },
  { key: 'bodyType', label: 'Body Type' },
  { key: 'bodyMaterial', label: 'Body Material' },
  { key: 'neckType', label: 'Neck Type' },
  { key: 'neckMaterial', label: 'Neck Material' },
  { key: 'fretboardMaterial', label: 'Fretboard Material' },
  { key: 'fretboardRadius', label: 'Fretboard Radius' },
  { key: 'numberOfFrets', label: 'Number of Frets' },
  { key: 'scaleLength', label: 'Scale Length' },
  { key: 'pickupConfiguration', label: 'Pickup Configuration' },
  { key: 'neckPickup', label: 'Neck Pickup' },
  { key: 'middlePickup', label: 'Middle Pickup' },
  { key: 'bridgePickup', label: 'Bridge Pickup' },
  { key: 'bridgeType', label: 'Bridge' },
  { key: 'hardwareColor', label: 'Hardware Color' },
  { key: 'countryOfOrigin', label: 'Country of Origin' },
  { key: 'yearsProduced', label: 'Years Produced' },
  { key: 'msrp', label: 'MSRP' },
];

export default defineComponent({
  name: 'GuitarDetailPage',
  components: { ArrowLeft, ChevronLeft, ChevronRight, ExternalLink, ImageOff, Maximize2, X },
  setup() {
    const { fetchGuitar } = useGuitarApi();
    const route = useRoute();
    return { fetchGuitar, route };
  },
  data() {
    return {
      guitar: null as GuitarDetailDto | null,
      loading: true,
      error: null as string | null,
      selectedImageIndex: 0,
      specFields: SPEC_FIELDS,
      lightboxOpen: false,
    };
  },
  computed: {
    displaySpecs(): Array<{ label: string; value: string }> {
      if (!this.guitar) return [];
      return this.specFields
        .filter((f) => {
          const val = this.guitar![f.key];
          return val !== null && val !== undefined && val !== '';
        })
        .map((f) => ({
          label: f.label,
          value: String(this.guitar![f.key]),
        }));
    },
    finishList(): string[] {
      return this.guitar?.finishes ?? [];
    },
    images(): GuitarImageDto[] {
      return this.guitar?.images ?? [];
    },
    selectedImage(): GuitarImageDto | null {
      return this.images[this.selectedImageIndex] ?? null;
    },
    lightboxImageUrl(): string | null {
      return this.selectedImage?.url ?? this.guitar?.primaryImageUrl ?? null;
    },
    extraAttributes(): Array<{ key: string; value: string }> {
      if (!this.guitar?.rawAttributes) return [];
      const shownKeys = new Set(this.specFields.map((f) => f.label.toLowerCase()));
      return Object.entries(this.guitar.rawAttributes)
        .filter(([key]) => !shownKeys.has(key.toLowerCase()))
        .map(([key, value]) => ({ key, value }));
    },
    /** Description HTML with link styling applied. Links are already resolved by the backend. */
    processedDescription(): string | null {
      if (!this.guitar?.descriptionHtml) return null;
      return this.guitar.descriptionHtml.replace(
        /<a\s+href="([^"]+)">/g,
        '<a href="$1" class="text-primary underline underline-offset-2 hover:text-primary/80">',
      );
    },
  },
  async mounted() {
    await this.loadGuitar();
    window.addEventListener('keydown', this.handleKeydown);
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.handleKeydown);
    document.body.style.overflow = '';
  },
  methods: {
    async loadGuitar(): Promise<void> {
      this.loading = true;
      this.error = null;
      try {
        const slug = this.route.params.slug as string;
        this.guitar = await this.fetchGuitar(slug);
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Failed to load guitar';
      } finally {
        this.loading = false;
      }
    },
    selectImage(index: number): void {
      this.selectedImageIndex = index;
    },
    openLightbox(): void {
      if (!this.lightboxImageUrl) return;
      this.lightboxOpen = true;
      document.body.style.overflow = 'hidden';
    },
    closeLightbox(): void {
      this.lightboxOpen = false;
      document.body.style.overflow = '';
    },
    lightboxNext(): void {
      if (this.images.length <= 1) return;
      this.selectedImageIndex = (this.selectedImageIndex + 1) % this.images.length;
    },
    lightboxPrev(): void {
      if (this.images.length <= 1) return;
      this.selectedImageIndex = (this.selectedImageIndex - 1 + this.images.length) % this.images.length;
    },
    handleKeydown(e: KeyboardEvent): void {
      if (!this.lightboxOpen) return;
      if (e.key === 'ArrowRight') this.lightboxNext();
      else if (e.key === 'ArrowLeft') this.lightboxPrev();
      else if (e.key === 'Escape') this.closeLightbox();
    },
  },
});
</script>

<template>
  <div class="container py-6">
    <!-- Back link -->
    <NuxtLink
      to="/"
      class="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
    >
      <ArrowLeft class="h-4 w-4" />
      Back to search
    </NuxtLink>

    <!-- Loading state -->
    <div v-if="loading" class="space-y-6">
      <div class="h-8 bg-muted animate-pulse rounded w-1/3" />
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div class="aspect-square bg-muted animate-pulse rounded-lg" />
        <div class="space-y-3">
          <div class="h-4 bg-muted animate-pulse rounded w-full" />
          <div class="h-4 bg-muted animate-pulse rounded w-3/4" />
          <div class="h-4 bg-muted animate-pulse rounded w-1/2" />
        </div>
      </div>
    </div>

    <!-- Error state -->
    <div
      v-else-if="error"
      class="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center"
    >
      <p class="text-destructive">{{ error }}</p>
      <NuxtLink
        to="/"
        class="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Return to search
      </NuxtLink>
    </div>

    <!-- Guitar detail -->
    <div v-else-if="guitar">
      <h1 class="text-3xl font-bold tracking-tight mb-6">{{ guitar.name }}</h1>

      <!-- Description -->
      <div
        v-if="processedDescription"
        class="prose prose-sm max-w-none mb-8 text-muted-foreground [&_p]:mb-3 [&_p:last-child]:mb-0"
        v-html="processedDescription"
      />

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Image gallery -->
        <div>
          <!-- Main image -->
          <div
            class="aspect-square rounded-lg border bg-card overflow-hidden mb-3 group relative"
            :class="lightboxImageUrl ? 'cursor-pointer' : ''"
            @click="openLightbox"
          >
            <img
              v-if="selectedImage"
              :src="selectedImage.url"
              :alt="guitar.name"
              class="w-full h-full object-contain"
            />
            <img
              v-else-if="guitar.primaryImageUrl"
              :src="guitar.primaryImageUrl"
              :alt="guitar.name"
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
              v-if="lightboxImageUrl"
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
                :alt="`${guitar.name} image ${idx + 1}`"
                class="w-full h-full object-contain"
                loading="lazy"
              />
            </button>
          </div>
        </div>

        <!-- Specifications -->
        <div>
          <!-- Quick info badges -->
          <div class="flex flex-wrap gap-2 mb-6">
            <div
              v-if="guitar.series"
              class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-primary/10 text-primary border-primary/20"
            >
              {{ guitar.series }} Series
            </div>
            <div
              v-if="guitar.tremolo !== null"
              class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold"
              :class="guitar.tremolo
                ? 'bg-blue-500/10 text-blue-700 border-blue-500/20'
                : 'bg-secondary text-secondary-foreground'"
            >
              {{ guitar.tremolo ? 'Tremolo' : 'Fixed Bridge' }}
            </div>
            <div
              v-if="guitar.countryOfOrigin"
              class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-green-500/10 text-green-700 border-green-500/20"
            >
              {{ guitar.countryOfOrigin }}
            </div>
          </div>

          <!-- Spec table -->
          <div class="rounded-lg border bg-card shadow-sm overflow-hidden">
            <div class="px-4 py-3 border-b bg-muted/50">
              <h2 class="text-sm font-semibold tracking-tight">Specifications</h2>
            </div>
            <table class="w-full">
              <tbody>
                <tr
                  v-for="(spec, idx) in displaySpecs"
                  :key="spec.label"
                  class="border-b last:border-0"
                  :class="idx % 2 === 0 ? 'bg-card' : 'bg-muted/30'"
                >
                  <td class="px-4 py-2.5 text-sm font-medium text-muted-foreground w-2/5">
                    {{ spec.label }}
                  </td>
                  <td class="px-4 py-2.5 text-sm">
                    {{ spec.value }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Finishes -->
          <div v-if="finishList.length > 0" class="mt-6">
            <h2 class="text-sm font-semibold tracking-tight mb-2">Available Finishes</h2>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="finish in finishList"
                :key="finish"
                class="inline-flex items-center rounded-full border bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground"
              >
                {{ finish }}
              </span>
            </div>
          </div>

          <!-- Extra raw attributes -->
          <div v-if="extraAttributes.length > 0" class="mt-6">
            <h2 class="text-sm font-semibold tracking-tight mb-2">Additional Details</h2>
            <div class="rounded-lg border bg-card shadow-sm overflow-hidden">
              <table class="w-full">
                <tbody>
                  <tr
                    v-for="(attr, idx) in extraAttributes"
                    :key="attr.key"
                    class="border-b last:border-0"
                    :class="idx % 2 === 0 ? 'bg-card' : 'bg-muted/30'"
                  >
                    <td class="px-4 py-2.5 text-sm font-medium text-muted-foreground w-2/5">
                      {{ attr.key }}
                    </td>
                    <td class="px-4 py-2.5 text-sm">
                      {{ attr.value }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Wiki link -->
          <div v-if="guitar.wikiUrl" class="mt-6">
            <a
              :href="guitar.wikiUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1.5 text-sm font-medium underline underline-offset-4 hover:text-foreground text-muted-foreground transition-colors"
            >
              View on Ibanez Wiki
              <ExternalLink class="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Lightbox modal -->
  <Teleport to="body">
    <div
      v-if="lightboxOpen"
      class="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
    >
      <!-- Backdrop: click outside image to close -->
      <div class="absolute inset-0" @click="closeLightbox" />

      <!-- Image -->
       <div class="bg-white p-10">
         <img
           v-if="lightboxImageUrl"
           :src="lightboxImageUrl"
           :alt="guitar?.name"
           class="relative z-10 max-w-[90vw] max-h-[90vh] object-contain select-none"
         />
       </div>

      <!-- Close button -->
      <button
        type="button"
        class="absolute z-20 top-4 right-4 rounded-full bg-white/10 text-white p-2 hover:bg-white/25 transition-colors"
        aria-label="Close image viewer"
        @click="closeLightbox"
      >
        <X class="h-5 w-5" />
      </button>

      <!-- Prev arrow -->
      <button
        v-if="images.length > 1"
        type="button"
        class="absolute z-20 left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 text-white p-3 hover:bg-white/25 transition-colors"
        aria-label="Previous image"
        @click="lightboxPrev"
      >
        <ChevronLeft class="h-6 w-6" />
      </button>

      <!-- Next arrow -->
      <button
        v-if="images.length > 1"
        type="button"
        class="absolute z-20 right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 text-white p-3 hover:bg-white/25 transition-colors"
        aria-label="Next image"
        @click="lightboxNext"
      >
        <ChevronRight class="h-6 w-6" />
      </button>

      <!-- Image counter -->
      <div
        v-if="images.length > 1"
        class="absolute z-20 bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm tabular-nums"
      >
        {{ selectedImageIndex + 1 }} / {{ images.length }}
      </div>
    </div>
  </Teleport>
</template>
