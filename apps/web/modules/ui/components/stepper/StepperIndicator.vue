<script lang="ts" setup>
import { StepperIndicator, type StepperIndicatorProps } from 'reka-ui'
import { computed, type HTMLAttributes } from 'vue'
import { cn } from '@/modules/ui/lib/utils'

const props = defineProps<StepperIndicatorProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props
  return delegated
})
</script>

<template>
  <StepperIndicator
    v-bind="delegatedProps"
    :class="cn(
      'flex size-10 items-center justify-center rounded-full border-2 text-sm font-bold transition-all duration-300',
      'group-data-[state=completed]:border-primary group-data-[state=completed]:bg-primary group-data-[state=completed]:text-primary-foreground',
      'group-data-[state=active]:border-primary group-data-[state=active]:bg-primary/10 group-data-[state=active]:text-primary',
      'group-data-[state=inactive]:border-border group-data-[state=inactive]:text-muted-foreground',
      props.class,
    )"
  >
    <slot />
  </StepperIndicator>
</template>
