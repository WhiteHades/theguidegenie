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
    <div class="flex size-10 items-center justify-center rounded-lg bg-primary/10">
      <span class="text-2xl">🧞</span>
    </div>
    <span
      v-if="props.withLabel"
      class="ml-3 hidden text-lg text-foreground md:block"
      >The Guide Genie</span
    >
  </span>
</template>
