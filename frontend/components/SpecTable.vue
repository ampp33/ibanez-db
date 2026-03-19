<script lang="ts">
import { defineComponent, type PropType } from 'vue';

export default defineComponent({
  name: 'SpecTable',
  props: {
    rows: {
      type: Array as PropType<Array<{ label: string; value: string }>>,
      required: true,
    },
  },
});
</script>

<template>
  <table class="w-full">
    <tbody>
      <tr
        v-for="(row, idx) in rows"
        :key="row.label"
        class="border-b last:border-0"
        :class="idx % 2 === 0 ? 'bg-card' : 'bg-muted/30'"
      >
        <td class="px-4 py-2.5 text-sm font-medium text-muted-foreground w-2/5">
          {{ row.label }}
        </td>
        <td class="px-4 py-2.5 text-sm">
          {{ row.value }}
        </td>
      </tr>
    </tbody>
  </table>
</template>
