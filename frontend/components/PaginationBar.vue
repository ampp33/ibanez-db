<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'PaginationBar',
  props: {
    page: {
      type: Number,
      required: true,
    },
    totalPages: {
      type: Number,
      required: true,
    },
  },
  emits: ['go-to-page'],
  computed: {
    visiblePages(): number[] {
      const pages: number[] = [];
      const start = Math.max(1, this.page - 2);
      const end = Math.min(this.totalPages, this.page + 2);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      return pages;
    },
  },
  methods: {
    goTo(p: number): void {
      if (p >= 1 && p <= this.totalPages) {
        this.$emit('go-to-page', p);
      }
    },
  },
});
</script>

<template>
  <nav class="mt-8 flex items-center justify-center gap-1">
    <Button
      variant="outline"
      size="sm"
      :disabled="page <= 1"
      @click="goTo(page - 1)"
    >
      Previous
    </Button>
    <Button
      v-for="p in visiblePages"
      :key="p"
      :variant="p === page ? 'default' : 'outline'"
      size="sm"
      class="w-9"
      @click="goTo(p)"
    >
      {{ p }}
    </Button>
    <Button
      variant="outline"
      size="sm"
      :disabled="page >= totalPages"
      @click="goTo(page + 1)"
    >
      Next
    </Button>
  </nav>
</template>
