<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'GuitarCardSkeleton',
});
</script>

<template>
  <div class="rounded-lg border bg-card overflow-hidden">
    <Skeleton class="aspect-[4/3] rounded-none" />
    <div class="p-4 space-y-3">
      <Skeleton class="h-4 w-3/4" />
      <Skeleton class="h-3 w-1/2" />
      <div class="flex gap-1.5">
        <Skeleton class="h-5 w-12 rounded-full" />
        <Skeleton class="h-5 w-16 rounded-full" />
      </div>
    </div>
  </div>
</template>
