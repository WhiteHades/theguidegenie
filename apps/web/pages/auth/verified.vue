<script setup lang="ts">
import { CheckCircleIcon, ArrowRightIcon, LoaderIcon } from "lucide-vue-next";

definePageMeta({ layout: "saas-auth" });
useSeoMeta({ title: "email verified" });

const { user, loading } = useAuth();
const localePath = useLocalePath();
const { t } = useTranslations();

// Determine next path based on user type
const nextPath = computed(() => {
  if (user.value?.user_type === 'guide') return '/guides/onboarding';
  return '/tours';
});
</script>

<template>
  <div class="flex flex-col items-center text-center space-y-6 animate-in fade-in zoom-in duration-500">
    <!-- Success Icon -->
    <div class="relative size-20 sm:size-24 flex items-center justify-center rounded-full bg-primary/10 text-primary mb-2">
      <CheckCircleIcon class="size-10 sm:size-12" />
      <div class="absolute inset-0 rounded-full border border-primary/20 animate-ping opacity-20" />
    </div>

    <div class="space-y-2">
      <h1 class="font-display text-2xl font-bold sm:text-3xl tracking-tight">
        email verified
      </h1>
      <p class="text-muted-foreground max-w-[300px] mx-auto text-sm sm:text-base">
        your account has been successfully verified. you can now access all features.
      </p>
    </div>

    <div class="w-full max-w-sm pt-4">
      <Button size="lg" class="w-full btn-bounce rounded-full" as-child>
        <NuxtLink :to="localePath(nextPath)">
          continue to app
          <ArrowRightIcon class="ml-2 size-4" />
        </NuxtLink>
      </Button>
    </div>
  </div>
</template>
