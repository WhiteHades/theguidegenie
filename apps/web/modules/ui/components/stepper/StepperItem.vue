<script lang="ts" setup>
import { StepperItem, type StepperItemProps } from 'reka-ui'
import { computed, type HTMLAttributes } from 'vue'
import { cn } from '@/modules/ui/lib/utils'

const props = defineProps<StepperItemProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props
  return delegated
})
</script>

<template>
  <StepperItem
    v-bind="delegatedProps"
    :class="cn('group relative flex flex-1 items-center justify-center', props.class)"
  >
    <slot />
  </StepperItem>
</template>
