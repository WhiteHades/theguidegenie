<script setup lang="ts">
import {
  MapPinIcon,
  ClockIcon,
  UsersIcon,
  StarIcon,
  ArrowRightIcon,
  CheckIcon,
  SparklesIcon,
  CalendarIcon,
  HeartIcon,
} from "lucide-vue-next";

definePageMeta({ layout: "marketing" });

const { searchPhotos, buildImageUrl } = useUnsplash();

// client-side data refs
const budapestPhotos = ref<any[]>([]);
const featuredTours = ref<any[]>([]);
const loading = ref(true);

// fetch data on client only
onMounted(async () => {
  await nextTick();
  
  const supabase = useSupabase();
  
  try {
    // fetch photos
    const photos = await searchPhotos({
      query: "budapest hungary landmark",
      perPage: 10,
      orientation: "landscape",
    });
    budapestPhotos.value = photos || [];

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

// computed images from api
const heroImage = computed(() => {
  if (budapestPhotos.value?.[0]) {
    return buildImageUrl(budapestPhotos.value[0].urls.raw, {
      width: 1920,
      quality: 90,
    });
  }
  return "https://images.unsplash.com/photo-1541849546-216549ae216d?w=1920&q=90";
});

const galleryImages = computed(() => {
  if (!budapestPhotos.value?.length) return [];
  return budapestPhotos.value.slice(1, 7).map((photo: any) => ({
    src: buildImageUrl(photo.urls.raw, { width: 800, quality: 85 }),
    alt: photo.alt_description || "budapest",
    photographer: photo.user.name,
  }));
});

const stats = [
  { value: "2,500+", label: "happy travelers" },
  { value: "50+", label: "unique tours" },
  { value: "4.9", label: "avg rating" },
  { value: "30+", label: "local guides" },
];

const packages = [
  {
    name: "walking tour",
    price: 35,
    duration: "3 hours",
    features: ["local expert guide", "hidden gems & stories", "small groups max 12"],
    accent: false,
  },
  {
    name: "food & wine",
    price: 65,
    duration: "4 hours",
    features: ["5 authentic tastings", "wine pairing included", "market visit"],
    accent: true,
  },
  {
    name: "night experience",
    price: 45,
    duration: "2.5 hours",
    features: ["famous ruin bars", "city lights tour", "welcome drink"],
    accent: false,
  },
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
  <div class="min-h-screen">
    <!-- hero -->
    <section class="relative flex min-h-screen items-end pb-20 pt-32">
      <div class="absolute inset-0">
        <img
          :src="heroImage"
          alt="budapest parliament at sunset"
          class="h-full w-full object-cover"
        />
        <div
          class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30"
        />
      </div>

      <div class="container relative">
        <div class="max-w-3xl">
          <Badge variant="warning" class="mb-6 text-xs">
            <StarIcon class="mr-1 size-3 fill-current" />
            rated 4.9/5 by travelers
          </Badge>

          <h1
            class="font-display text-5xl font-bold leading-[1.1] text-white md:text-6xl lg:text-7xl"
          >
            discover<br />
            <span class="text-accent">budapest</span><br />
            with locals
          </h1>

          <p class="mt-6 max-w-lg text-lg text-white/80">
            authentic experiences, hidden gems, unforgettable stories. 
            join 2,500+ travelers who found the real budapest.
          </p>

          <div class="mt-10 flex flex-wrap items-center gap-4">
            <Button
              size="lg"
              class="rounded-full bg-accent px-8 text-accent-foreground hover:bg-accent/90"
              as-child
            >
              <NuxtLink to="/tours" class="inline-flex items-center gap-2">
                explore tours
                <ArrowRightIcon class="size-4" />
              </NuxtLink>
            </Button>
            <Button
              variant="outline"
              size="lg"
              class="rounded-full border-white/20 text-white hover:bg-white/10"
              as-child
            >
              <NuxtLink to="/guides/signup">become a guide</NuxtLink>
            </Button>
          </div>
        </div>

        <!-- floating stats -->
        <div
          class="mt-16 grid max-w-2xl grid-cols-4 gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
        >
          <div v-for="stat in stats" :key="stat.label" class="text-center">
            <div class="text-2xl font-bold text-white md:text-3xl">
              {{ stat.value }}
            </div>
            <div class="mt-1 text-xs text-white/60">{{ stat.label }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- photo mosaic gallery -->
    <section class="bg-background py-24">
      <div class="container">
        <div class="mb-12 max-w-xl">
          <Badge variant="info" class="mb-4">
            <MapPinIcon class="mr-1 size-3" />
            explore
          </Badge>
          <h2 class="font-display text-3xl font-bold md:text-4xl">
            moments waiting<br />
            <span class="text-muted-foreground">to be discovered</span>
          </h2>
        </div>

        <!-- masonry-style gallery -->
        <div v-if="galleryImages.length" class="grid gap-4 md:grid-cols-3">
          <div class="space-y-4">
            <Card
              v-if="galleryImages[0]"
              class="group overflow-hidden border-0 bg-transparent"
            >
              <div class="relative aspect-[4/5] overflow-hidden rounded-2xl">
                <img
                  :src="galleryImages[0].src"
                  :alt="galleryImages[0].alt"
                  class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
            </Card>
            <Card
              v-if="galleryImages[1]"
              class="group overflow-hidden border-0 bg-transparent"
            >
              <div class="relative aspect-[4/3] overflow-hidden rounded-2xl">
                <img
                  :src="galleryImages[1].src"
                  :alt="galleryImages[1].alt"
                  class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
            </Card>
          </div>
          <div class="space-y-4 md:pt-12">
            <Card
              v-if="galleryImages[2]"
              class="group overflow-hidden border-0 bg-transparent"
            >
              <div class="relative aspect-square overflow-hidden rounded-2xl">
                <img
                  :src="galleryImages[2].src"
                  :alt="galleryImages[2].alt"
                  class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
            </Card>
            <Card
              v-if="galleryImages[3]"
              class="group overflow-hidden border-0 bg-transparent"
            >
              <div class="relative aspect-[4/5] overflow-hidden rounded-2xl">
                <img
                  :src="galleryImages[3].src"
                  :alt="galleryImages[3].alt"
                  class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
            </Card>
          </div>
          <div class="space-y-4">
            <Card
              v-if="galleryImages[4]"
              class="group overflow-hidden border-0 bg-transparent"
            >
              <div class="relative aspect-[4/3] overflow-hidden rounded-2xl">
                <img
                  :src="galleryImages[4].src"
                  :alt="galleryImages[4].alt"
                  class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
            </Card>
            <Card
              v-if="galleryImages[5]"
              class="group overflow-hidden border-0 bg-transparent"
            >
              <div class="relative aspect-[4/5] overflow-hidden rounded-2xl">
                <img
                  :src="galleryImages[5].src"
                  :alt="galleryImages[5].alt"
                  class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
            </Card>
          </div>
        </div>

        <!-- loading skeleton -->
        <div v-else class="grid gap-4 md:grid-cols-3">
          <div class="space-y-4">
            <Skeleton class="aspect-[4/5] rounded-2xl" />
            <Skeleton class="aspect-[4/3] rounded-2xl" />
          </div>
          <div class="space-y-4 pt-12">
            <Skeleton class="aspect-square rounded-2xl" />
            <Skeleton class="aspect-[4/5] rounded-2xl" />
          </div>
          <div class="space-y-4">
            <Skeleton class="aspect-[4/3] rounded-2xl" />
            <Skeleton class="aspect-[4/5] rounded-2xl" />
          </div>
        </div>
      </div>
    </section>

    <!-- how it works -->
    <section class="border-y border-border bg-muted/30 py-24">
      <div class="container">
        <div class="mb-16 text-center">
          <Badge variant="info" class="mb-4">simple</Badge>
          <h2 class="font-display text-3xl font-bold md:text-4xl">
            book in 3 steps
          </h2>
        </div>

        <div class="mx-auto grid max-w-4xl gap-8 md:grid-cols-3">
          <div
            v-for="(step, i) in steps"
            :key="step.title"
            class="relative text-center"
          >
            <!-- connector line -->
            <div
              v-if="i < steps.length - 1"
              class="absolute left-[calc(50%+40px)] top-10 hidden h-px w-[calc(100%-80px)] bg-border md:block"
            />

            <div
              class="mx-auto flex size-20 items-center justify-center rounded-2xl bg-primary/10 text-primary"
            >
              <component :is="step.icon" class="size-8" />
            </div>
            <h3 class="mt-6 text-lg font-semibold">{{ step.title }}</h3>
            <p class="mt-2 text-sm text-muted-foreground">{{ step.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- packages -->
    <section class="py-24">
      <div class="container">
        <div class="mb-12 flex items-end justify-between">
          <div>
            <Badge variant="info" class="mb-4">experiences</Badge>
            <h2 class="font-display text-3xl font-bold md:text-4xl">
              popular packages
            </h2>
          </div>
          <Button variant="outline" class="hidden rounded-full md:flex" as-child>
            <NuxtLink to="/tours">view all tours</NuxtLink>
          </Button>
        </div>

        <div class="grid gap-6 md:grid-cols-3">
          <Card
            v-for="pkg in packages"
            :key="pkg.name"
            :class="[
              'relative overflow-hidden transition-all duration-300 hover:shadow-xl',
              pkg.accent ? 'border-accent' : '',
            ]"
          >
            <div
              v-if="pkg.accent"
              class="absolute right-4 top-4 rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground"
            >
              popular
            </div>
            <CardHeader>
              <CardTitle class="text-xl font-semibold">{{ pkg.name }}</CardTitle>
              <CardDescription class="flex items-center gap-2">
                <ClockIcon class="size-4" />
                {{ pkg.duration }}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div class="flex items-baseline gap-1">
                <span class="text-4xl font-bold">€{{ pkg.price }}</span>
                <span class="text-muted-foreground">/person</span>
              </div>
              <ul class="mt-6 space-y-3">
                <li
                  v-for="feature in pkg.features"
                  :key="feature"
                  class="flex items-center gap-2.5 text-sm"
                >
                  <div
                    class="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10"
                  >
                    <CheckIcon class="size-3 text-primary" />
                  </div>
                  {{ feature }}
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                :variant="pkg.accent ? 'default' : 'outline'"
                class="w-full"
                as-child
              >
                <NuxtLink to="/tours">book now</NuxtLink>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </section>

    <!-- featured tours -->
    <section v-if="featuredTours.length" class="border-t border-border bg-muted/30 py-24">
      <div class="container">
        <div class="mb-12 flex items-end justify-between">
          <div>
            <Badge variant="info" class="mb-4">featured</Badge>
            <h2 class="font-display text-3xl font-bold md:text-4xl">
              top-rated tours
            </h2>
          </div>
          <Button variant="outline" class="rounded-full" as-child>
            <NuxtLink to="/tours">explore all</NuxtLink>
          </Button>
        </div>

        <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Card
            v-for="(tour, idx) in featuredTours.slice(0, 3)"
            :key="tour.id"
            class="group cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-lg"
            @click="navigateTo(`/tours/${tour.id}`)"
          >
            <div class="relative aspect-[16/10] overflow-hidden">
              <img
                :src="
                  budapestPhotos?.[idx + 1]?.urls?.regular ||
                  'https://images.unsplash.com/photo-1541849546-216549ae216d?w=600&q=80'
                "
                :alt="tour.title"
                class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <CardContent class="p-5">
              <div class="flex items-center gap-2 text-xs text-muted-foreground">
                <MapPinIcon class="size-3.5" />
                {{ tour.guides?.city || "budapest" }}
              </div>
              <h3 class="mt-2 font-semibold">{{ tour.title }}</h3>
              <p class="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
                {{ tour.description }}
              </p>
            </CardContent>
            <CardFooter class="flex items-center justify-between border-t p-5 pt-4">
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
    <section class="relative overflow-hidden py-32">
      <div class="absolute inset-0">
        <img
          :src="budapestPhotos?.[7]?.urls?.regular || heroImage"
          alt="budapest"
          class="h-full w-full object-cover"
        />
        <div class="absolute inset-0 bg-primary/80" />
      </div>
      <div class="container relative text-center">
        <h2 class="font-display text-4xl font-bold text-white md:text-5xl">
          ready to explore?
        </h2>
        <p class="mx-auto mt-4 max-w-lg text-white/80">
          join thousands of travelers discovering the real budapest with passionate local guides
        </p>
        <div class="mt-10 flex flex-wrap justify-center gap-4">
          <Button
            size="lg"
            class="rounded-full bg-white px-10 text-primary hover:bg-white/90"
            as-child
          >
            <NuxtLink to="/tours" class="inline-flex items-center gap-2">
              book a tour
              <ArrowRightIcon class="size-4" />
            </NuxtLink>
          </Button>
          <Button
            variant="outline"
            size="lg"
            class="rounded-full border-white/30 text-white hover:bg-white/10"
            as-child
          >
            <NuxtLink to="/auth/tourist/signup">create account</NuxtLink>
          </Button>
        </div>
      </div>
    </section>
  </div>
</template>
