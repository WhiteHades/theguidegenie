<script lang="ts" setup>
import { StepperSeparator, type StepperSeparatorProps } from 'reka-ui'
import { computed, type HTMLAttributes } from 'vue'
import { cn } from '@/modules/ui/lib/utils'

const props = defineProps<StepperSeparatorProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props
  return delegated
})
</script>

<template>
  <StepperSeparator
    v-bind="delegatedProps"
    :class="cn(
      'absolute left-[calc(50%+24px)] right-[calc(-50%+24px)] top-5 h-0.5 shrink-0 rounded-full transition-colors',
      'group-data-[state=completed]:bg-primary',
      'bg-border',
      props.class,
    )"
  />
</template>
