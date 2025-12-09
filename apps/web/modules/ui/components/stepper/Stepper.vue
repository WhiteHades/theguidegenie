<script lang="ts" setup>
import { StepperRoot, useForwardPropsEmits, type StepperRootEmits, type StepperRootProps } from 'reka-ui'
import { computed, type HTMLAttributes } from 'vue'
import { cn } from '@/modules/ui/lib/utils'

const props = defineProps<StepperRootProps & { class?: HTMLAttributes['class'] }>()
const emits = defineEmits<StepperRootEmits>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props
  return delegated
})

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <StepperRoot v-bind="forwarded" :class="cn('flex gap-2', props.class)">
    <slot />
  </StepperRoot>
</template>
