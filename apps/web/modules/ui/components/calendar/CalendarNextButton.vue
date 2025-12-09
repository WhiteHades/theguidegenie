<script lang="ts" setup>
import { CalendarNext, type CalendarNextProps } from 'reka-ui'
import { ChevronRightIcon } from 'lucide-vue-next'
import { computed, type HTMLAttributes } from 'vue'
import { cn } from '@/modules/ui/lib/utils'

const props = defineProps<CalendarNextProps & { class?: HTMLAttributes['class'] }>()
const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props
  return delegated
})
</script>

<template>
  <CalendarNext
    :class="cn(
      'inline-flex size-7 items-center justify-center rounded-md border border-input bg-transparent p-0 opacity-50 shadow-sm hover:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none',
      props.class,
    )"
    v-bind="delegatedProps"
  >
    <slot>
      <ChevronRightIcon class="size-4" />
    </slot>
  </CalendarNext>
</template>
