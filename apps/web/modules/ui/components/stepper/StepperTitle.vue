<script lang="ts" setup>
import { StepperTitle, type StepperTitleProps } from 'reka-ui'
import { computed, type HTMLAttributes } from 'vue'
import { cn } from '@/modules/ui/lib/utils'

const props = defineProps<StepperTitleProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props
  return delegated
})
</script>

<template>
  <StepperTitle
    v-bind="delegatedProps"
    :class="cn(
      'text-xs font-medium uppercase tracking-wider transition-colors',
      'group-data-[state=active]:text-primary',
      'group-data-[state=completed]:text-primary',
      'group-data-[state=inactive]:text-muted-foreground/50',
      props.class,
    )"
  >
    <slot />
  </StepperTitle>
</template>
