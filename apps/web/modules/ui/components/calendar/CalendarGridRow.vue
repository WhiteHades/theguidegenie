<script lang="ts" setup>
import { CalendarGridRow, type CalendarGridRowProps } from 'reka-ui'
import { computed, type HTMLAttributes } from 'vue'
import { cn } from '@/modules/ui/lib/utils'

const props = defineProps<CalendarGridRowProps & { class?: HTMLAttributes['class'] }>()
const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props
  return delegated
})
</script>

<template>
  <CalendarGridRow :class="cn('mt-2 flex w-full', props.class)" v-bind="delegatedProps">
    <slot />
  </CalendarGridRow>
</template>
