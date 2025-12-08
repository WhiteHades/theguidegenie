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
  { server: false }
);

const bgImage = computed(() => {
  if (authPhoto.value) {
    return buildImageUrl(authPhoto.value.urls.raw, {
      width: 1920,
      quality: 85,
    });
  }
  return fallbackImage;
});

function onImageLoad() {
  imageLoaded.value = true;
}
</script>

<template>
  <div class="flex min-h-screen">
    <!-- left: cover image -->
    <div class="relative hidden w-1/2 lg:block overflow-hidden">
      <!-- fallback shown immediately -->
      <img
        :src="fallbackImage"
        alt="budapest"
        class="absolute inset-0 h-full w-full object-cover"
      />
      <img
        v-if="bgImage !== fallbackImage"
        :src="bgImage"
        alt="budapest"
        class="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
        :class="imageLoaded ? 'opacity-100' : 'opacity-0'"
        @load="onImageLoad"
      />
      <div
        class="absolute inset-0 bg-gradient-to-br from-primary/60 via-primary/30 to-background/90"
      />

      <!-- overlay content -->
      <div class="absolute inset-0 flex flex-col justify-between p-10">
        <!-- logo -->
        <NuxtLink
          to="/"
          class="inline-flex w-fit items-center gap-2.5 animate-in fade-in slide-in-from-left-4 duration-500"
        >
          <div
            class="flex size-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm"
          >
            <span class="font-display text-lg font-bold text-white">G</span>
          </div>
          <span class="font-display text-xl font-semibold text-white">
            the guide genie
          </span>
        </NuxtLink>

        <!-- tagline -->
        <div
          class="max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200"
        >
          <blockquote class="font-display text-2xl font-medium leading-relaxed text-white">
            "discover the real budapest through the eyes of passionate locals"
          </blockquote>
          <div class="mt-6 flex items-center gap-3">
            <div class="flex -space-x-2">
              <Avatar class="size-8 border-2 border-white/20 bg-white/10 backdrop-blur-sm">
                <AvatarFallback class="bg-transparent text-xs font-bold text-white">M</AvatarFallback>
              </Avatar>
              <Avatar class="size-8 border-2 border-white/20 bg-white/10 backdrop-blur-sm">
                <AvatarFallback class="bg-transparent text-xs font-bold text-white">A</AvatarFallback>
              </Avatar>
              <Avatar class="size-8 border-2 border-white/20 bg-white/10 backdrop-blur-sm">
                <AvatarFallback class="bg-transparent text-xs font-bold text-white">J</AvatarFallback>
              </Avatar>
            </div>
            <span class="text-sm text-white/80">2,500+ happy travelers</span>
          </div>
        </div>
      </div>
    </div>

    <!-- right: auth form -->
    <div class="flex w-full flex-col justify-between bg-background p-6 lg:w-1/2 lg:p-12">
      <!-- header -->
      <div class="flex items-center justify-between">
        <NuxtLink
          to="/"
          class="font-display text-lg font-semibold lg:hidden"
        >
          the guide genie
        </NuxtLink>
        <ColorModeToggle class="ml-auto" />
      </div>

      <!-- form container -->
      <main
        class="mx-auto w-full max-w-sm py-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100"
      >
        <slot />
      </main>

      <!-- footer -->
      <p class="text-center text-xs text-muted-foreground">
        © {{ new Date().getFullYear() }} the guide genie · budapest
      </p>
    </div>
  </div>
</template>
