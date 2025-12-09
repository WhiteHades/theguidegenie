<script lang="ts" setup>
import { StepperTrigger, type StepperTriggerProps } from 'reka-ui'
import { computed, type HTMLAttributes } from 'vue'
import { cn } from '@/modules/ui/lib/utils'

const props = defineProps<StepperTriggerProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props
  return delegated
})
</script>

<template>
  <StepperTrigger
    v-bind="delegatedProps"
    :class="cn('flex flex-col items-center gap-2', props.class)"
  >
    <slot />
  </StepperTrigger>
</template>
