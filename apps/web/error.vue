<script setup lang="ts">
  import { UndoIcon } from "lucide-vue-next";

  const props = defineProps<{
    error: {
      statusCode: number;
      message?: string;
    };
  }>();

  const errorTitle = computed(() => {
    if (props.error.statusCode === 404) return "page not found";
    if (props.error.statusCode === 500) return "something went wrong";
    return "an error occurred";
  });

  function handleError() {
    clearError({ redirect: "/" });
  }
</script>

<template>
  <div class="flex h-screen flex-col items-center justify-center bg-background">
    <h1 class="text-5xl font-bold text-foreground">{{ error.statusCode }}</h1>
    <p class="mt-2 text-2xl text-muted-foreground">{{ errorTitle }}</p>

    <Button class="mt-6" @click="handleError">
      <UndoIcon class="mr-2 size-4" /> go to homepage
    </Button>
  </div>
</template>
