<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { Separator as SeparatorPrimitive } from "radix-vue";
import { cn } from "@/modules/ui/lib/utils";

interface SeparatorProps {
  orientation?: "horizontal" | "vertical";
  decorative?: boolean;
  class?: HTMLAttributes["class"];
  label?: string;
}

const props = withDefaults(defineProps<SeparatorProps>(), {
  orientation: "horizontal",
  decorative: true,
});
</script>

<template>
  <SeparatorPrimitive
    :decorative="decorative"
    :orientation="orientation"
    :class="
      cn(
        'shrink-0 bg-border',
        orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
        props.class,
      )
    "
  >
    <span
      v-if="label"
      class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-4 text-xs text-muted-foreground"
    >
      {{ label }}
    </span>
  </SeparatorPrimitive>
</template>

