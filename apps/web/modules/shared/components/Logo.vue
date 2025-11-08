<script setup lang="ts">
  const props = withDefaults(
    defineProps<{
      withLabel?: boolean;
    }>(),
    {
      withLabel: true,
    },
  );
</script>

<template>
  <span class="flex items-center font-semibold leading-none text-primary">
    <!-- TODO: own -->
    <div class="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
      <span class="text-2xl">🧞</span>
    </div>
    <span
      v-if="props.withLabel"
      class="ml-3 hidden text-lg text-foreground md:block"
      >The Guide Genie</span
    >
  </span>
</template>
