<script setup lang="ts">
  const props = withDefaults(
    defineProps<{
      withLabel?: boolean;
    }>(),
    {
      withLabel: true,
    },
  );

  const colors = {
    primary: "#10b981",
  };
</script>

<template>
  <span :style="{ color: colors.primary, fontWeight: 600, lineHeight: 1 }">
    <!-- TODO: Replace with your own logo -->
    <span
      :style="{
        display: 'inline-block',
        height: '40px',
        width: '40px',
        fontSize: '32px',
        lineHeight: '40px',
        textAlign: 'center',
        float: 'left',
      }"
    >🧞</span>

    <span
      v-if="props.withLabel"
      :style="{
        display: 'inline-block',
        height: '40px',
        lineHeight: '40px',
        marginLeft: '12px',
        fontSize: '18px',
      }"
      >The Guide Genie</span
    >
  </span>
</template>
