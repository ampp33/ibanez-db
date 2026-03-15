<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue';
import { Separator as SeparatorRoot, type SeparatorProps } from 'radix-vue';
import { cn } from '~/lib/utils';

interface Props extends SeparatorProps {
  class?: HTMLAttributes['class'];
}

const props = withDefaults(defineProps<Props>(), {
  orientation: 'horizontal',
  decorative: true,
});

const delegatedProps = computed(() => {
  const { class: _, ...rest } = props;
  return rest;
});
</script>

<template>
  <SeparatorRoot
    v-bind="delegatedProps"
    :class="cn(
      'shrink-0 bg-border',
      props.orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
      props.class,
    )"
  />
</template>
