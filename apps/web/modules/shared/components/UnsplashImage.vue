<script setup lang="ts">
  import type { UnsplashPhoto } from "~/composables/useUnsplash";

  interface Props {
    photo: UnsplashPhoto;
    width?: number;
    height?: number;
    quality?: number;
    class?: string;
    showAttribution?: boolean;
    lazy?: boolean;
  }

  const props = withDefaults(defineProps<Props>(), {
    width: 1080,
    quality: 80,
    showAttribution: true,
    lazy: true,
  });

  const { buildImageUrl, trackDownload } = useUnsplash();

  const imageUrl = computed(() =>
    buildImageUrl(props.photo.urls.raw, {
      width: props.width,
      height: props.height,
      quality: props.quality,
    }),
  );

  onMounted(() => {
    if (props.photo.links?.download_location)
      trackDownload(props.photo.links.download_location);
  });

  const photographerUrl = computed(
    () =>
      `${props.photo.user.links.html}?utm_source=theguidegenie&utm_medium=referral`,
  );
  const unsplashUrl =
    "https://unsplash.com/?utm_source=theguidegenie&utm_medium=referral";
</script>

<template>
  <div
    class="unsplash-image group relative overflow-hidden"
    :class="props.class"
  >
    <img
      :src="imageUrl"
      :alt="photo.alt_description || photo.description || 'unsplash photo'"
      :loading="lazy ? 'lazy' : 'eager'"
      class="h-full w-full object-cover smooth"
    />

    <div
      v-if="showAttribution"
      class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 group-hover:opacity-100 smooth"
    >
      <p class="text-xs text-white/90 lowercase">
        photo by
        <a
          :href="photographerUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="underline underline-offset-2"
        >
          {{ photo.user.name }}
        </a>
        on
        <a
          :href="unsplashUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="underline underline-offset-2"
        >
          unsplash
        </a>
      </p>
    </div>
  </div>
</template>
