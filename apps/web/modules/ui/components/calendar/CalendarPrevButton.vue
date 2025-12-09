<script lang="ts" setup>
import { CalendarPrev, type CalendarPrevProps } from 'reka-ui'
import { ChevronLeftIcon } from 'lucide-vue-next'
import { computed, type HTMLAttributes } from 'vue'
import { cn } from '@/modules/ui/lib/utils'

const props = defineProps<CalendarPrevProps & { class?: HTMLAttributes['class'] }>()
const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props
  return delegated
})
</script>

<template>
  <CalendarPrev
    :class="cn(
      'inline-flex size-7 items-center justify-center rounded-md border border-input bg-transparent p-0 opacity-50 shadow-sm hover:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none',
      props.class,
    )"
    v-bind="delegatedProps"
  >
    <slot>
      <ChevronLeftIcon class="size-4" />
    </slot>
  </CalendarPrev>
</template>
