<script setup lang="ts">
  // @ts-nocheck
  import {
    MapPinIcon,
    MailIcon,
    PhoneIcon,
    ArrowLeftIcon,
    StarIcon,
    CalendarIcon,
    UsersIcon,
    ShipIcon,
    LandmarkIcon,
    BadgeEuroIcon,
    FootprintsIcon,
    HeartIcon,
  } from "lucide-vue-next";

  definePageMeta({ layout: "marketing" });

  const route = useRoute();
  const supabase = useSupabase();
  const { searchPhotos, buildImageUrl } = useUnsplash();

  const loading = ref(true);
  const guide = ref(null);
  const tours = ref([]);

  // category icons
  const categoryIcons = {
    free: FootprintsIcon,
    paid: BadgeEuroIcon,
    boat: ShipIcon,
    museum: LandmarkIcon,
  };

  // fetch guide photos from unsplash
  const { data: guidePhotos } = await useAsyncData(
    "guide-profile-photos",
    async () => {
      const photos = await searchPhotos({
        query: "budapest walking tour",
        perPage: 6,
        orientation: "landscape",
      });
      return photos;
    },
    { server: false },
  );

  async function fetchGuideProfile() {
    loading.value = true;
    const params = route.params;
    const guideId = Array.isArray(params.id) ? params.id[0] : params.id;

    try {
      const { data: guideData } = await supabase
        .from("guides")
        .select("*")
        .eq("id", guideId)
        .single();

      guide.value = guideData;

      if (guide.value) {
        const { data: toursData } = await supabase
          .from("tours")
          .select("*")
          .eq("guide_id", guide.value.id)
          .eq("is_public", true)
          .order("created_at", { ascending: false });

        tours.value = toursData || [];
      }
    } catch (e) {
      console.error("fetch error:", e);
    } finally {
      loading.value = false;
    }
  }

  onMounted(fetchGuideProfile);

  useSeoMeta({
    title: () => guide.value?.name ? `${guide.value.name} - local guide` : "guide profile",
    description: () => guide.value?.bio || "discover tours with this local guide",
  });

  const getTourPhoto = (index) => {
    if (guidePhotos.value?.[index % guidePhotos.value.length]) {
      return buildImageUrl(
        guidePhotos.value[index % guidePhotos.value.length].urls.raw,
        { width: 600, quality: 80 },
      );
    }
    return "https://images.unsplash.com/photo-1541849546-216549ae216d?w=600&q=80";
  };

  const getTourPriceDisplay = (tour) => {
    if (tour.category === "free" || (tour.tips_enabled && !tour.base_price_cents)) {
      return { text: "free", subtext: "tip-based" };
    }
    const price = tour.base_price_cents ? (tour.base_price_cents / 100).toFixed(0) : "35";
    return { text: `€${price}`, subtext: "per person" };
  };
</script>

<template>
  <div class="min-h-screen">
    <!-- loading -->
    <div v-if="loading" class="flex min-h-screen items-center justify-center">
      <div
        class="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
      />
    </div>

    <!-- not found -->
    <div
      v-else-if="!guide"
      class="flex min-h-screen flex-col items-center justify-center text-center"
    >
      <h1 class="text-2xl font-bold">guide not found</h1>
      <p class="mt-2 text-muted-foreground">this profile may have been removed</p>
      <Button
        @click="navigateTo('/tours')"
        class="mt-4 btn-bounce rounded-full"
        variant="outline"
      >
        browse all tours
      </Button>
    </div>

    <!-- guide profile -->
    <template v-else>
      <!-- header -->
      <section class="border-b border-border bg-gradient-to-b from-primary/5 to-background py-12">
        <div class="container">
          <button
            @click="navigateTo('/tours')"
            class="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground smooth"
          >
            <ArrowLeftIcon class="size-4" />
            back to tours
          </button>

          <div class="flex flex-col items-start gap-8 md:flex-row">
            <!-- avatar -->
            <div class="relative">
              <div
                v-if="guide.avatar_url"
                class="size-32 overflow-hidden rounded-full border-4 border-background shadow-xl md:size-40"
              >
                <img
                  :src="guide.avatar_url"
                  :alt="guide.name"
                  class="h-full w-full object-cover"
                />
              </div>
              <div
                v-else
                class="flex size-32 items-center justify-center rounded-full border-4 border-background bg-primary/10 shadow-xl md:size-40"
              >
                <span class="font-display text-4xl font-bold text-primary md:text-5xl">
                  {{ guide.name?.charAt(0).toUpperCase() }}
                </span>
              </div>
              <!-- verified badge -->
              <div class="absolute -bottom-2 -right-2 rounded-full bg-accent p-2 shadow-lg">
                <StarIcon class="size-5 fill-accent-foreground text-accent-foreground" />
              </div>
            </div>

            <!-- info -->
            <div class="flex-1">
              <h1 class="font-display text-3xl font-bold md:text-4xl">{{ guide.name }}</h1>
              
              <div class="mt-3 flex flex-wrap items-center gap-4 text-muted-foreground">
                <span class="flex items-center gap-2">
                  <MapPinIcon class="size-4" />
                  {{ guide.city }}
                </span>
                <span class="flex items-center gap-2">
                  <CalendarIcon class="size-4" />
                  {{ tours.length }} {{ tours.length === 1 ? 'tour' : 'tours' }}
                </span>
                <span class="flex items-center gap-2">
                  <StarIcon class="size-4 fill-accent text-accent" />
                  4.9 rating
                </span>
              </div>

              <p v-if="guide.bio" class="mt-4 max-w-2xl text-muted-foreground">
                {{ guide.bio }}
              </p>

              <!-- contact buttons -->
              <div class="mt-6 flex flex-wrap gap-3">
                <a
                  v-if="guide.contact_email"
                  :href="`mailto:${guide.contact_email}`"
                  class="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:border-primary hover:bg-primary/5 smooth"
                >
                  <MailIcon class="size-4" />
                  contact
                </a>
                <a
                  v-if="guide.phone"
                  :href="`tel:${guide.phone}`"
                  class="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:border-primary hover:bg-primary/5 smooth"
                >
                  <PhoneIcon class="size-4" />
                  call
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- tours section -->
      <section class="py-12">
        <div class="container">
          <h2 class="small-caps font-display text-2xl font-bold">tours by {{ guide.name }}</h2>

          <div v-if="tours.length === 0" class="mt-8 rounded-2xl border border-dashed p-12 text-center">
            <UsersIcon class="mx-auto size-12 text-muted-foreground/30" />
            <p class="mt-4 text-muted-foreground">this guide hasn't published any tours yet</p>
          </div>

          <div v-else class="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <NuxtLink
              v-for="(tour, i) in tours"
              :key="tour.id"
              :to="`/tours/${tour.id}`"
              class="group overflow-hidden rounded-2xl border border-border bg-card card-hover"
            >
              <div class="relative aspect-[4/3] overflow-hidden">
                <img
                  :src="getTourPhoto(i)"
                  :alt="tour.title"
                  class="h-full w-full object-cover smooth group-hover:scale-105"
                />
                <!-- category badge -->
                <div class="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium backdrop-blur-sm">
                  <component 
                    :is="categoryIcons[tour.category] || BadgeEuroIcon" 
                    class="size-3.5" 
                  />
                  {{ tour.category || 'paid' }}
                </div>
                <!-- free badge -->
                <div 
                  v-if="tour.category === 'free' || (tour.tips_enabled && !tour.base_price_cents)"
                  class="absolute right-3 top-3 rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-accent-foreground"
                >
                  free
                </div>
              </div>

              <div class="p-6">
                <h3 class="text-lg font-semibold group-hover:text-primary smooth">
                  {{ tour.title }}
                </h3>
                <p class="mt-2 line-clamp-2 text-sm text-muted-foreground">
                  {{ tour.description || "explore budapest with a passionate local" }}
                </p>
                <div class="mt-4 flex items-center justify-between border-t border-border pt-4">
                  <div>
                    <span 
                      class="text-xl font-bold"
                      :class="tour.category === 'free' ? 'text-accent' : ''"
                    >{{ getTourPriceDisplay(tour).text }}</span>
                    <span class="ml-1 text-xs text-muted-foreground">{{ getTourPriceDisplay(tour).subtext }}</span>
                  </div>
                  <span class="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    view tour
                  </span>
                </div>
              </div>
            </NuxtLink>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

