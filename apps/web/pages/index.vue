<script setup lang="ts">
import {
  MapPinIcon,
  ClockIcon,
  StarIcon,
  ArrowRightIcon,
  CheckIcon,
  SparklesIcon,
  CalendarIcon,
  HeartIcon,
  ExternalLinkIcon,
} from "lucide-vue-next";

definePageMeta({ layout: "marketing" });

const { searchPhotos, buildImageUrl, trackDownload } = useUnsplash();

// Fallback images in case Unsplash API fails
const fallbackImages = [
  "https://images.unsplash.com/photo-1541849546-216549ae216d?w=1920&q=90",
  "https://images.unsplash.com/photo-1551867633-194f125bddfa?w=800&q=85",
  "https://images.unsplash.com/photo-1565426873118-a17ed65d74b9?w=800&q=85",
  "https://images.unsplash.com/photo-1577587230708-187fdbef4d91?w=800&q=85",
  "https://images.unsplash.com/photo-1509395176047-4a66953fd231?w=800&q=85",
  "https://images.unsplash.com/photo-1560969184-10fe8719e047?w=800&q=85",
  "https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=800&q=85",
  "https://images.unsplash.com/photo-1571847140471-1d7766e825ea?w=800&q=85",
];

// client-side data refs
const budapestPhotos = ref<any[]>([]);
const featuredTours = ref<any[]>([]);
const loading = ref(true);
const heroImageLoaded = ref(false);
const dynamicHeroImage = ref<string | null>(null);
const animationsInitialized = ref(false);

// Current hero photo data for attribution
const heroPhotoData = computed(() => budapestPhotos.value?.[0] || null);

// fetch data on client only
onMounted(async () => {
  await nextTick();
  
  // Initialize GSAP animations after a short delay
  setTimeout(() => {
    initScrollAnimations();
  }, 100);
  
  const supabase = useSupabase();
  
  try {
    // fetch photos
    const photos = await searchPhotos({
      query: "budapest hungary landmark",
      perPage: 10,
      orientation: "landscape",
    });
    
    if (photos && photos.length > 0) {
      budapestPhotos.value = photos;
      
      // Preload the hero image
      const heroUrl = buildImageUrl(photos[0].urls.raw, { width: 1920, quality: 90 });
      const img = new Image();
      img.onload = () => {
        dynamicHeroImage.value = heroUrl;
        heroImageLoaded.value = true;
        trackDownload(photos[0].links.download_location);
      };
      img.onerror = () => {
        console.warn("Failed to load hero image");
      };
      img.src = heroUrl;
    } else {
      console.warn("No photos from Unsplash API, using fallbacks");
    }

    // fetch tours
    if (supabase) {
      const { data, error } = await supabase
        .from("tours")
        .select(`*, guides (name, city, avatar_url)`)
        .eq("is_public", true)
        .limit(6);
      
      if (error) {
        console.error("Supabase error:", error);
      } else {
        featuredTours.value = data || [];
      }
    }
  } catch (e) {
    console.error("Failed to fetch data:", e);
  } finally {
    loading.value = false;
  }
});

// Computed hero image - always shows default first
const heroImage = computed(() => dynamicHeroImage.value || fallbackImages[0]);

// computed images from api with fallbacks
const galleryImages = computed(() => {
  if (budapestPhotos.value?.length > 1) {
    return budapestPhotos.value.slice(1, 7).map((photo: any) => ({
      src: buildImageUrl(photo.urls.raw, { width: 800, quality: 85 }),
      alt: photo.alt_description || "budapest",
      photographer: photo.user?.name || "Unsplash",
      photographerUrl: photo.user?.links?.html || "https://unsplash.com",
      photoUrl: photo.links?.html || "https://unsplash.com",
    }));
  }
  // Fallback images if API fails
  return fallbackImages.slice(1, 7).map((src, i) => ({
    src,
    alt: "budapest landmark",
    photographer: "Unsplash",
    photographerUrl: "https://unsplash.com",
    photoUrl: "https://unsplash.com",
  }));
});

// GSAP scroll animations - simplified and more robust
function initScrollAnimations() {
  if (typeof window === 'undefined') return;
  if (animationsInitialized.value) return;
  
  animationsInitialized.value = true;
  
  // Use CSS-based animations as alternative to GSAP for reliability
  const animateOnScroll = () => {
    const elements = document.querySelectorAll('.animate-on-scroll');
    elements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const isVisible = rect.top < window.innerHeight * 0.85;
      if (isVisible) {
        el.classList.add('animate-visible');
      }
    });
  };
  
  // Initial check
  animateOnScroll();
  
  // On scroll
  window.addEventListener('scroll', animateOnScroll, { passive: true });
  
  // Animate hero immediately
  const heroContent = document.querySelector('.hero-content');
  const heroStats = document.querySelector('.hero-stats');
  if (heroContent) heroContent.classList.add('animate-visible');
  setTimeout(() => {
    if (heroStats) heroStats.classList.add('animate-visible');
  }, 300);
}

const stats = [
  { value: "2,500+", label: "happy travelers" },
  { value: "50+", label: "unique tours" },
  { value: "4.9", label: "avg rating" },
  { value: "30+", label: "local guides" },
];


const steps = [
  {
    icon: SparklesIcon,
    title: "discover",
    desc: "browse curated tours by locals",
  },
  {
    icon: CalendarIcon,
    title: "book",
    desc: "pick your date & time instantly",
  },
  {
    icon: HeartIcon,
    title: "experience",
    desc: "meet your guide and explore",
  },
];
</script>

<template>
  <div class="min-h-screen overflow-x-hidden">
    <!-- Hero -->
    <section class="relative flex h-screen min-h-[600px] items-center pt-20">
      <div class="absolute inset-0 overflow-hidden">
        <img
          :src="heroImage"
          alt="budapest parliament at sunset"
          class="h-full w-full object-cover transition-opacity duration-1000 ease-out"
          :class="heroImageLoaded ? 'opacity-100' : 'opacity-0'"
          loading="eager"
          fetchpriority="high"
        />
        <div
          class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30"
        />
      </div>

      <div class="container relative z-10">
        <div class="max-w-3xl">
          <div class="mb-6 inline-flex items-center gap-1.5 text-xs font-bold uppercase text-amber-950">
            <span class="relative px-3 py-1.5">
              <span class="relative z-10 flex items-center gap-1.5">
                <StarIcon class="size-3 fill-current" />
                rated 4.9/5 by travelers
              </span>
              <span class="absolute inset-0 z-0 bg-amber-400 brush-edge-box transform -skew-x-3 rotate-1 scale-105"></span>
            </span>
          </div>

          <h1 class="font-display text-4xl font-bold leading-[1.3] text-white sm:text-5xl md:text-6xl lg:text-7xl">
            <span class="relative inline-block px-2">
              <span class="relative z-10">discover</span>
              <span class="absolute inset-0 z-0 bg-black/80 brush-edge-box transform -skew-x-2 -rotate-1 scale-110"></span>
            </span><br />
            <span class="relative inline-block px-2 mt-2">
              <span class="relative z-10 text-accent">budapest</span>
              <span class="absolute inset-0 z-0 bg-black brush-edge-box transform -skew-x-3 rotate-1 scale-110 shadow-xl"></span>
            </span><br />
            <span class="relative inline-block px-2 mt-1">
              <span class="relative z-10">with locals</span>
              <span class="absolute inset-0 z-0 bg-black/80 brush-edge-box transform -skew-x-1 -rotate-0.5 scale-105"></span>
            </span>
          </h1>

          <p class="mt-8 max-w-lg text-base sm:text-lg leading-loose font-medium text-white">
            <span class="relative inline-block px-2 py-1 my-1 box-decoration-clone">
              <span class="relative z-10">authentic experiences, hidden gems, unforgettable stories.</span>
              <span class="absolute inset-x-0 top-0 bottom-0 z-0 bg-black/60 brush-edge-box transform -skew-x-1 scale-y-110"></span>
            </span><br class="hidden sm:block" />
            <span class="relative inline-block px-2 py-1 my-1 box-decoration-clone delay-100">
               <span class="relative z-10">join 2,500+ travelers who found the real budapest.</span>
               <span class="absolute inset-x-0 top-0 bottom-0 z-0 bg-black/60 brush-edge-box transform skew-x-1 scale-y-110"></span>
            </span>
          </p>

          <div class="mt-8 flex flex-wrap items-center gap-3 sm:mt-10 sm:gap-4">
            <Button
              size="lg"
              class="group rounded-full bg-accent px-6 text-accent-foreground transition-all duration-300 hover:bg-accent/90 hover:scale-105 hover:shadow-lg sm:px-8"
              as-child
            >
              <NuxtLink to="/tours" class="inline-flex items-center gap-2">
                explore tours
                <ArrowRightIcon class="size-4 transition-transform duration-300 group-hover:translate-x-1" />
              </NuxtLink>
            </Button>
            <Button
              variant="outline"
              size="lg"
              class="rounded-full border-white/30 bg-white/10 text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/20 hover:scale-105"
              as-child
            >
              <NuxtLink to="/guides/signup">become a guide</NuxtLink>
            </Button>
          </div>
        </div>

        <!-- floating stats -->
        <div
          class="hero-stats mt-10 grid max-w-2xl grid-cols-2 gap-3 rounded-2xl bg-gray-900/95 p-4 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl sm:mt-16 sm:grid-cols-4 sm:gap-4 sm:p-6"
        >
          <div v-for="stat in stats" :key="stat.label" class="text-center">
            <div class="text-xl font-bold text-white sm:text-2xl md:text-3xl">
              {{ stat.value }}
            </div>
            <div class="mt-1 text-xs text-white/70">{{ stat.label }}</div>
          </div>
        </div>
      </div>
      
      <!-- Unsplash photo credit -->
      <div v-if="heroPhotoData" class="absolute bottom-24 right-4 z-10 flex items-center gap-1.5 text-[10px] text-white/40 sm:bottom-28 sm:right-6">
        <span>Photo by</span>
        <a 
          :href="`${heroPhotoData.user.links.html}?utm_source=theguidegenie&utm_medium=referral`"
          target="_blank"
          rel="noopener noreferrer"
          class="underline hover:text-white/60 transition-colors"
        >
          {{ heroPhotoData.user.name }}
        </a>
        <span>on</span>
        <a 
          href="https://unsplash.com/?utm_source=theguidegenie&utm_medium=referral"
          target="_blank"
          rel="noopener noreferrer"
          class="underline hover:text-white/60 transition-colors"
        >
          Unsplash
        </a>
      </div>
      
      <!-- Wave divider -->
      <div class="absolute -bottom-1 left-0 right-0 overflow-hidden will-change-transform">
        <svg 
          class="relative block w-full h-12 sm:h-16 md:h-24"
          preserveAspectRatio="none"
          viewBox="0 0 1200 120"
          xmlns="http://www.w3.org/2000/svg"
          style="transition: none !important;"
        >
          <path 
            d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
            class="fill-background"
            style="transition: none !important;"
          />
        </svg>
      </div>
    </section>

    <!-- Photo gallery section -->
    <section class="relative bg-background py-10 sm:py-20 -mt-16 md:-mt-24 pt-20 sm:pt-28">
      <div class="container">
        <div class="animate-on-scroll mb-8 max-w-xl opacity-0 translate-y-8 transition-all duration-700 ease-out sm:mb-12">
          <Badge variant="info" class="mb-4">
            <MapPinIcon class="size-3" />
            explore
          </Badge>
          <h2 class="font-display text-2xl font-bold sm:text-3xl md:text-4xl">
            moments waiting<br />
            <span class="text-muted-foreground">to be discovered</span>
          </h2>
        </div>

        <!-- masonry-style gallery - ALWAYS show images -->
        <div class="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-3">
          <div class="space-y-3 sm:space-y-4">
            <div
              class="animate-on-scroll gallery-item gallery-hover group relative rounded-xl sm:rounded-2xl aspect-[4/5] opacity-0 translate-y-8 transition-all duration-700 ease-out"
            >
              <img
                :src="galleryImages[0]?.src || fallbackImages[1]"
                :alt="galleryImages[0]?.alt || 'budapest'"
                class="h-full w-full object-cover transition-opacity duration-700"
                style="opacity: 0"
                onload="this.style.opacity='1'"
              />
              <!-- Photo credit overlay -->
              <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 sm:p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <a 
                  :href="galleryImages[0]?.photographerUrl || 'https://unsplash.com'"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex items-center gap-1 text-xs text-white/90 hover:text-white"
                  @click.stop
                >
                  {{ galleryImages[0]?.photographer || 'Unsplash' }}
                  <ExternalLinkIcon class="size-3" />
                </a>
              </div>
            </div>
            <div
              class="animate-on-scroll gallery-item gallery-hover group relative rounded-xl sm:rounded-2xl aspect-[4/3] opacity-0 translate-y-8 transition-all duration-700 ease-out delay-100"
            >
              <img
                :src="galleryImages[1]?.src || fallbackImages[2]"
                :alt="galleryImages[1]?.alt || 'budapest'"
                class="h-full w-full object-cover transition-opacity duration-700"
                style="opacity: 0"
                onload="this.style.opacity='1'"
              />
              <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 sm:p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <a 
                  :href="galleryImages[1]?.photographerUrl || 'https://unsplash.com'"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex items-center gap-1 text-xs text-white/90 hover:text-white"
                  @click.stop
                >
                  {{ galleryImages[1]?.photographer || 'Unsplash' }}
                  <ExternalLinkIcon class="size-3" />
                </a>
              </div>
            </div>
          </div>
          <div class="space-y-3 sm:space-y-4 md:pt-12">
            <div
              class="animate-on-scroll gallery-item group relative overflow-hidden rounded-xl sm:rounded-2xl aspect-square opacity-0 translate-y-8 transition-all duration-700 ease-out delay-150"
            >
              <img
                :src="galleryImages[2]?.src || fallbackImages[3]"
                :alt="galleryImages[2]?.alt || 'budapest'"
                class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 transition-opacity duration-700"
                style="opacity: 0"
                onload="this.style.opacity='1'"
              />
              <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 sm:p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <a 
                  :href="galleryImages[2]?.photographerUrl || 'https://unsplash.com'"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex items-center gap-1 text-xs text-white/90 hover:text-white"
                  @click.stop
                >
                  {{ galleryImages[2]?.photographer || 'Unsplash' }}
                  <ExternalLinkIcon class="size-3" />
                </a>
              </div>
            </div>
            <div
              class="animate-on-scroll gallery-item group relative overflow-hidden rounded-xl sm:rounded-2xl aspect-[4/5] opacity-0 translate-y-8 transition-all duration-700 ease-out delay-200"
            >
              <img
                :src="galleryImages[3]?.src || fallbackImages[4]"
                :alt="galleryImages[3]?.alt || 'budapest'"
                class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 transition-opacity duration-700"
                style="opacity: 0"
                onload="this.style.opacity='1'"
              />
              <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 sm:p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <a 
                  :href="galleryImages[3]?.photographerUrl || 'https://unsplash.com'"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex items-center gap-1 text-xs text-white/90 hover:text-white"
                  @click.stop
                >
                  {{ galleryImages[3]?.photographer || 'Unsplash' }}
                  <ExternalLinkIcon class="size-3" />
                </a>
              </div>
            </div>
          </div>
          <div class="hidden md:block space-y-3 sm:space-y-4">
            <div
              class="animate-on-scroll gallery-item group relative overflow-hidden rounded-xl sm:rounded-2xl aspect-[4/3] opacity-0 translate-y-8 transition-all duration-700 ease-out delay-250"
            >
              <img
                :src="galleryImages[4]?.src || fallbackImages[5]"
                :alt="galleryImages[4]?.alt || 'budapest'"
                class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 transition-opacity duration-700"
                style="opacity: 0"
                onload="this.style.opacity='1'"
              />
              <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 sm:p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <a 
                  :href="galleryImages[4]?.photographerUrl || 'https://unsplash.com'"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex items-center gap-1 text-xs text-white/90 hover:text-white"
                  @click.stop
                >
                  {{ galleryImages[4]?.photographer || 'Unsplash' }}
                  <ExternalLinkIcon class="size-3" />
                </a>
              </div>
            </div>
            <div
              class="animate-on-scroll gallery-item group relative overflow-hidden rounded-xl sm:rounded-2xl aspect-[4/5] opacity-0 translate-y-8 transition-all duration-700 ease-out delay-300"
            >
              <img
                :src="galleryImages[5]?.src || fallbackImages[6]"
                :alt="galleryImages[5]?.alt || 'budapest'"
                class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 transition-opacity duration-700"
                style="opacity: 0"
                onload="this.style.opacity='1'"
              />
              <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 sm:p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <a 
                  :href="galleryImages[5]?.photographerUrl || 'https://unsplash.com'"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex items-center gap-1 text-xs text-white/90 hover:text-white"
                  @click.stop
                >
                  {{ galleryImages[5]?.photographer || 'Unsplash' }}
                  <ExternalLinkIcon class="size-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- how it works -->
    <section class="relative border-y border-border bg-muted/30 py-10 sm:py-20">
      <div class="container">
        <div class="animate-on-scroll mb-12 text-center opacity-0 translate-y-8 transition-all duration-700 ease-out sm:mb-16">
          <Badge variant="info" class="mb-4">simple</Badge>
          <h2 class="font-display text-2xl font-bold sm:text-3xl md:text-4xl">
            book in 3 steps
          </h2>
        </div>

        <div class="mx-auto flex max-w-4xl flex-col gap-8 sm:flex-row sm:items-start sm:gap-4">
          <!-- Step 1 -->
          <div class="animate-on-scroll relative z-10 flex flex-1 flex-col items-center text-center opacity-0 translate-y-8 transition-all duration-700 ease-out">
            <div class="mx-auto flex size-16 items-center justify-center rounded-2xl bg-card border border-border text-primary transition-all duration-300 hover:scale-110 hover:bg-primary/10 sm:size-20 shadow-sm">
              <component :is="steps[0].icon" class="size-6 sm:size-8" />
            </div>
            <h3 class="mt-4 text-base font-semibold sm:mt-6 sm:text-lg">{{ steps[0].title }}</h3>
            <p class="mt-1 text-sm text-muted-foreground sm:mt-2 max-w-[200px]">{{ steps[0].desc }}</p>
          </div>

          <!-- Connector 1 -->
          <div class="hidden pt-10 sm:block sm:flex-1">
            <div class="h-px w-full bg-border"></div>
          </div>

          <!-- Step 2 -->
          <div class="animate-on-scroll relative z-10 flex flex-1 flex-col items-center text-center opacity-0 translate-y-8 transition-all duration-700 ease-out delay-100">
            <div class="mx-auto flex size-16 items-center justify-center rounded-2xl bg-card border border-border text-primary transition-all duration-300 hover:scale-110 hover:bg-primary/10 sm:size-20 shadow-sm">
              <component :is="steps[1].icon" class="size-6 sm:size-8" />
            </div>
            <h3 class="mt-4 text-base font-semibold sm:mt-6 sm:text-lg">{{ steps[1].title }}</h3>
            <p class="mt-1 text-sm text-muted-foreground sm:mt-2 max-w-[200px]">{{ steps[1].desc }}</p>
          </div>

          <!-- Connector 2 -->
          <div class="hidden pt-10 sm:block sm:flex-1">
            <div class="h-px w-full bg-border"></div>
          </div>

          <!-- Step 3 -->
           <div class="animate-on-scroll relative z-10 flex flex-1 flex-col items-center text-center opacity-0 translate-y-8 transition-all duration-700 ease-out delay-200">
            <div class="mx-auto flex size-16 items-center justify-center rounded-2xl bg-card border border-border text-primary transition-all duration-300 hover:scale-110 hover:bg-primary/10 sm:size-20 shadow-sm">
              <component :is="steps[2].icon" class="size-6 sm:size-8" />
            </div>
            <h3 class="mt-4 text-base font-semibold sm:mt-6 sm:text-lg">{{ steps[2].title }}</h3>
            <p class="mt-1 text-sm text-muted-foreground sm:mt-2 max-w-[200px]">{{ steps[2].desc }}</p>
          </div>
        </div>
      </div>
    </section>


    <!-- featured tours -->
    <section v-if="featuredTours.length" class="border-t border-border bg-muted/30 py-10 sm:py-20">
      <div class="container">
        <div class="animate-on-scroll mb-8 flex flex-col gap-4 sm:mb-12 sm:flex-row sm:items-end sm:justify-between opacity-0 translate-y-8 transition-all duration-700 ease-out">
          <div>
            <Badge variant="info" class="mb-4">featured</Badge>
            <h2 class="font-display text-2xl font-bold sm:text-3xl md:text-4xl">
              top-rated tours
            </h2>
          </div>
          <Button variant="outline" class="w-fit rounded-full transition-all duration-300 hover:scale-105" as-child>
            <NuxtLink to="/tours">explore all</NuxtLink>
          </Button>
        </div>

        <div class="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <Card
            v-for="(tour, idx) in featuredTours.slice(0, 3)"
            :key="tour.id"
            class="animate-on-scroll tour-card group cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 opacity-0 translate-y-8"
            :style="{ transitionDelay: `${idx * 100}ms` }"
            @click="navigateTo(`/tours/${tour.id}`)"
          >
            <div class="relative aspect-[16/10] overflow-hidden">
              <img
                :src="
                  budapestPhotos?.[idx + 4]?.urls?.regular ||
                  fallbackImages[idx + 4]
                "
                :alt="tour.title"
                class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <CardContent class="p-4 sm:p-5">
              <div class="flex items-center gap-2 text-xs text-muted-foreground">
                <MapPinIcon class="size-3.5" />
                {{ tour.guides?.city || "budapest" }}
              </div>
              <h3 class="mt-2 font-semibold line-clamp-1">{{ tour.title }}</h3>
              <p class="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {{ tour.description }}
              </p>
            </CardContent>
            <CardFooter class="flex items-center justify-between border-t p-4 pt-3 sm:p-5 sm:pt-4">
              <span class="text-lg font-bold">
                €{{ tour.base_price_cents ? (tour.base_price_cents / 100).toFixed(0) : "35" }}
              </span>
              <span class="text-xs text-muted-foreground">per person</span>
            </CardFooter>
          </Card>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="relative overflow-hidden py-16 sm:py-28">
      <div class="absolute inset-0">
        <img
          :src="budapestPhotos?.[7]?.urls?.regular || fallbackImages[7]"
          :alt="budapestPhotos?.[7]?.alt_description || 'budapest'"
          class="h-full w-full object-cover transition-opacity duration-1000"
          style="opacity: 0"
          onload="this.style.opacity='1'"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-black/95 via-black/70 to-black/50" />
      </div>
      <div class="container relative text-center">
        <h2 class="font-display text-3xl font-bold text-white sm:text-4xl md:text-5xl">
          ready to explore?
        </h2>
        <p class="mx-auto mt-4 max-w-lg text-sm text-white/80 sm:text-base">
          join thousands of travelers discovering the real budapest with passionate local guides
        </p>
        <div class="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-4">
          <Button
            size="lg"
            class="group rounded-full bg-white px-8 text-primary transition-all duration-300 hover:bg-white/90 hover:scale-105 sm:px-10"
            as-child
          >
            <NuxtLink to="/tours" class="inline-flex items-center gap-2">
              book a tour
              <ArrowRightIcon class="size-4 transition-transform duration-300 group-hover:translate-x-1" />
            </NuxtLink>
          </Button>
          <Button
            variant="outline"
            size="lg"
            class="rounded-full border-white/30 text-white transition-all duration-300 hover:bg-white/10 hover:scale-105"
            as-child
          >
            <NuxtLink to="/auth/tourist/signup">create account</NuxtLink>
          </Button>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.animate-on-scroll.animate-visible {
  opacity: 1 !important;
  transform: translateY(0) !important;
}

.hero-content,
.hero-stats {
  transition-property: opacity, transform !important;
  transition-duration: 0.7s !important;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1) !important;
}

.brush-edge-box {
  clip-path: polygon(
    2% 0%, 15% 2%, 25% 0%, 35% 2%, 45% 0%, 55% 2%, 65% 0%, 75% 2%, 85% 0%, 95% 2%, 100% 0%,
    98% 15%, 100% 25%, 98% 35%, 100% 45%, 98% 55%, 100% 65%, 98% 75%, 100% 85%, 98% 95%, 100% 100%,
    85% 98%, 75% 100%, 65% 98%, 55% 100%, 45% 98%, 35% 100%, 25% 98%, 15% 100%, 2% 98%, 0% 100%,
    2% 85%, 0% 75%, 2% 65%, 0% 55%, 2% 45%, 0% 35%, 2% 25%, 0% 15%
  );
  box-decoration-break: clone;
  -webkit-box-decoration-break: clone;
}

.font-display, p {
  will-change: auto;
  -webkit-font-smoothing: antialiased;
  backface-visibility: hidden;
}
</style>
