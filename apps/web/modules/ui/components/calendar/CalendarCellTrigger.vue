<script lang="ts" setup>
import { CalendarCellTrigger, type CalendarCellTriggerProps } from 'reka-ui'
import { computed, type HTMLAttributes } from 'vue'
import { cn } from '@/modules/ui/lib/utils'

const props = defineProps<CalendarCellTriggerProps & { class?: HTMLAttributes['class'] }>()
const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props
  return delegated
})
</script>

<template>
  <CalendarCellTrigger
    :class="cn(
      'inline-flex size-8 items-center justify-center whitespace-nowrap rounded-md p-0 text-sm font-normal ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:bg-accent hover:text-accent-foreground',
      '[&[data-today]:not([data-selected])]:bg-accent [&[data-today]:not([data-selected])]:text-accent-foreground',
      'data-[selected]:bg-primary data-[selected]:text-primary-foreground data-[selected]:hover:bg-primary data-[selected]:hover:text-primary-foreground data-[selected]:focus:bg-primary data-[selected]:focus:text-primary-foreground',
      'data-[disabled]:text-muted-foreground data-[disabled]:opacity-50',
      'data-[outside-view]:text-muted-foreground data-[outside-view]:opacity-50 [&[data-outside-view][data-selected]]:bg-accent/50 [&[data-outside-view][data-selected]]:text-muted-foreground [&[data-outside-view][data-selected]]:opacity-30',
      'data-[unavailable]:text-destructive-foreground data-[unavailable]:line-through',
      props.class,
    )"
    v-bind="delegatedProps"
  >
    <slot />
  </CalendarCellTrigger>
</template>
