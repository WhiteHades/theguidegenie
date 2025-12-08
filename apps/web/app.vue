<script setup lang="ts">
  import { ConfigProvider } from "radix-vue";
  import { configure } from "vee-validate";
  import { Analytics } from "@vercel/analytics/nuxt";

  configure({
    validateOnBlur: true,
    validateOnChange: true,
    validateOnInput: false,
    validateOnModelUpdate: false,
  });

  const useIdFunction = () => useId();

  const titleTemplateDefault = "The Guide Genie";
  const titleDivider = "|";

  const { init } = useAnalytics();

  // You might want to display a consent banner before initializing analytics
  init();

  useHead({
    // general seo
    titleTemplate: (title) =>
      title
        ? `${title} ${titleDivider} ${titleTemplateDefault}`
        : titleTemplateDefault,

    // Default to English since i18n is temporarily disabled
    htmlAttrs: {
      lang: "en",
    },
  });
</script>

<template>
  <ConfigProvider :use-id="useIdFunction">
    <GradientBackgroundWrapper>
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
      <Toaster />
      <NuxtLoadingIndicator color="var(--colors-primary)" />
      <Analytics />
    </GradientBackgroundWrapper>
  </ConfigProvider>
</template>
