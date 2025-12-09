<script lang="ts" setup>
import { CalendarHeadCell, type CalendarHeadCellProps } from 'reka-ui'
import { computed, type HTMLAttributes } from 'vue'
import { cn } from '@/modules/ui/lib/utils'

const props = defineProps<CalendarHeadCellProps & { class?: HTMLAttributes['class'] }>()
const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props
  return delegated
})
</script>

<template>
  <CalendarHeadCell :class="cn('w-8 rounded-md text-[0.8rem] font-normal text-muted-foreground', props.class)" v-bind="delegatedProps">
    <slot />
  </CalendarHeadCell>
</template>
