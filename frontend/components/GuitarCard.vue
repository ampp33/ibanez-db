<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import { ImageOff } from 'lucide-vue-next';
import type { GuitarDto } from '../types';

/**
 * Displays a guitar in the search results grid using shadcn-vue Card styling.
 */
export default defineComponent({
  name: 'GuitarCard',
  components: { ImageOff },
  props: {
    guitar: {
      type: Object as PropType<GuitarDto>,
      required: true,
    },
  },
  computed: {
    attributes(): Array<{ label: string; value: string }> {
      const attrs: Array<{ label: string; value: string }> = [];
      if (this.guitar.series) attrs.push({ label: 'Series', value: this.guitar.series });
      if (this.guitar.pickupConfiguration) attrs.push({ label: 'Pickups', value: this.guitar.pickupConfiguration });
      if (this.guitar.bridgeType) attrs.push({ label: 'Bridge', value: this.guitar.bridgeType });
      if (this.guitar.bodyMaterial) attrs.push({ label: 'Body', value: this.guitar.bodyMaterial });
      if (this.guitar.countryOfOrigin) attrs.push({ label: 'Origin', value: this.guitar.countryOfOrigin });
      return attrs.slice(0, 4);
    },
  },
});
</script>

<template>
  <NuxtLink
    :to="`/guitars/${guitar.slug}`"
    class="group rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md hover:border-ring/50 transition-all overflow-hidden flex flex-col"
  >
    <!-- Image -->
    <div class="aspect-[4/3] bg-muted overflow-hidden">
      <img
        v-if="guitar.primaryImageUrl"
        :src="guitar.primaryImageUrl"
        :alt="guitar.name"
        class="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
        loading="lazy"
      />
      <div
        v-else
        class="w-full h-full flex items-center justify-center text-muted-foreground/40"
      >
        <ImageOff class="h-16 w-16" :stroke-width="1" />
      </div>
    </div>

    <!-- Info -->
    <div class="p-4 flex flex-col flex-1">
      <h3 class="font-semibold leading-tight tracking-tight group-hover:text-primary transition-colors">
        {{ guitar.name }}
      </h3>
      <p
        v-if="guitar.yearsProduced"
        class="text-xs text-muted-foreground mt-1"
      >
        {{ guitar.yearsProduced }}
      </p>

      <div class="mt-3 flex flex-wrap gap-1.5">
        <span
          v-for="attr in attributes"
          :key="attr.label"
          class="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium text-muted-foreground transition-colors"
        >
          {{ attr.value }}
        </span>
      </div>
    </div>
  </NuxtLink>
</template>
