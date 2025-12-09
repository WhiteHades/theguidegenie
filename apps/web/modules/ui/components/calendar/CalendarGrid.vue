<script lang="ts" setup>
import { CalendarGrid, type CalendarGridProps } from 'reka-ui'
import { computed, type HTMLAttributes } from 'vue'
import { cn } from '@/modules/ui/lib/utils'

const props = defineProps<CalendarGridProps & { class?: HTMLAttributes['class'] }>()
const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props
  return delegated
})
</script>

<template>
  <CalendarGrid :class="cn('w-full border-collapse space-y-1', props.class)" v-bind="delegatedProps">
    <slot />
  </CalendarGrid>
</template>
