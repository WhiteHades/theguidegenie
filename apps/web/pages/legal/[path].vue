<script lang="ts" setup>
definePageMeta({
  layout: "marketing",
});

const route = useRoute();
const slug = computed(() => {
  const value = route.params.path;
  return Array.isArray(value) ? value[0] : value;
});
const contentPath = computed(() => `/legal/${slug.value}`);

const { data: page } = await useAsyncData(
  () => `legal:${contentPath.value}`,
  () => queryCollection("legal").path(contentPath.value).first(),
  {
    watch: [contentPath],
  },
);

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: "page not found" });
}

useSeoMeta({
  title: () => page.value?.title,
  description: () => page.value?.description,
});
</script>

<template>
  <div v-if="page" class="container max-w-6xl pb-16">
    <div class="mx-auto max-w-2xl">
      <h1 class="text-center text-4xl font-bold">{{ page.title }}</h1>
    </div>

    <ContentRenderer :value="page" class="prose mx-auto mt-6 max-w-2xl dark:prose-invert" />
  </div>
</template>
