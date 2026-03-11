<script setup lang="ts">
const fallbackImage = "https://images.unsplash.com/photo-1541849546-216549ae216d?w=1920&q=85";

const { searchPhotos, buildImageUrl } = useUnsplash();
const imageLoaded = ref(false);

const { data: authPhoto } = await useAsyncData(
  "auth-photo",
  async () => {
    const photos = await searchPhotos({
      query: "budapest architecture parliament",
      perPage: 1,
      orientation: "landscape",
    });

    return photos?.[0] || null;
  },
  { server: false },
);

const bgImage = computed(() => {
  if (!authPhoto.value) {
    return fallbackImage;
  }

  return buildImageUrl(authPhoto.value.urls.raw, {
    width: 1920,
    quality: 85,
  });
});
</script>

<template>
  <div class="flex min-h-screen">
    <div class="relative hidden overflow-hidden lg:block lg:w-1/2">
      <img :src="fallbackImage" alt="budapest" class="absolute inset-0 size-full object-cover" />
      <img
        v-if="bgImage !== fallbackImage"
        :src="bgImage"
        alt="budapest"
        class="absolute inset-0 size-full object-cover transition-opacity duration-700"
        :class="imageLoaded ? 'opacity-100' : 'opacity-0'"
        @load="imageLoaded = true"
      />
      <div class="absolute inset-0 bg-gradient-to-br from-primary/60 via-primary/30 to-background/90" />

      <div class="absolute inset-0 flex flex-col justify-between p-10">
        <NuxtLink to="/" class="inline-flex w-fit items-center gap-2.5">
          <div class="flex size-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
            <span class="font-display text-lg font-bold text-white">G</span>
          </div>
          <span class="font-display text-xl font-semibold text-white">the guide genie</span>
        </NuxtLink>

        <div class="max-w-md">
          <blockquote class="font-display text-2xl font-medium leading-relaxed text-white">
            "discover the real budapest through the eyes of passionate locals"
          </blockquote>
          <p class="mt-6 text-sm text-white/80">book tours as a traveller or create your own experiences as a guide.</p>
        </div>
      </div>
    </div>

    <div class="flex w-full flex-col justify-between bg-background p-6 lg:w-1/2 lg:p-12">
      <div class="flex items-center justify-between">
        <NuxtLink to="/" class="font-display text-lg font-semibold lg:hidden">the guide genie</NuxtLink>
        <ColorModeToggle class="ml-auto" />
      </div>

      <main class="mx-auto w-full max-w-sm py-8">
        <slot />
      </main>

      <p class="text-center text-xs text-muted-foreground">© {{ new Date().getFullYear() }} the guide genie</p>
    </div>
  </div>
</template>
