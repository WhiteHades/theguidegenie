<script lang="ts" setup>
import { CalendarHeading, type CalendarHeadingProps } from 'reka-ui'
import { computed, type HTMLAttributes } from 'vue'
import { cn } from '@/modules/ui/lib/utils'

const props = defineProps<CalendarHeadingProps & { class?: HTMLAttributes['class'] }>()
const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props
  return delegated
})
</script>

<template>
  <CalendarHeading :class="cn('text-sm font-medium', props.class)" v-bind="delegatedProps">
    <slot />
  </CalendarHeading>
</template>
