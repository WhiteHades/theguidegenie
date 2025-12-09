<script setup lang="ts">
import {
  MapPinIcon,
  UsersIcon,
  SearchIcon,
  ShipIcon,
  LandmarkIcon,
  BadgeEuroIcon,
  XIcon,
  SparklesIcon,
  HeartIcon,
  LayoutGridIcon,
  ListIcon,
  SlidersHorizontalIcon,
} from "lucide-vue-next";

definePageMeta({ layout: "marketing" });

useSeoMeta({
  title: "explore tours",
  description: "discover amazing walking tours in budapest with local guides",
});

const { searchPhotos, buildImageUrl } = useUnsplash();

// view mode
const viewMode = ref<"grid" | "list">("grid");

// filters
const selectedCategory = ref("all");
const searchQuery = ref("");

// category definitions
const categories = [
  { id: "all", label: "all", icon: SparklesIcon },
  { id: "free", label: "free", icon: HeartIcon },
  { id: "paid", label: "paid", icon: BadgeEuroIcon },
  { id: "boat", label: "boat", icon: ShipIcon },
  { id: "museum", label: "museums", icon: LandmarkIcon },
];

// client-side data - wrapped in refs that are only set on client
const tours = ref<any[]>([]);
const tourPhotos = ref<any[]>([]);
const loading = ref(true);
const photosLoading = ref(true);

// fetch data only on client to avoid hydration issues
onMounted(async () => {
  // small delay to ensure plugins are loaded
  await nextTick();
  
  const supabase = useSupabase();
  
  // fetch tours
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from("tours")
        .select("*, guides(*)")
        .eq("is_public", true)
        .order("created_at", { ascending: false });
      
      if (error) {
        console.error("Supabase error:", error);
      } else {
        tours.value = data || [];
      }
    } else {
      console.warn("Supabase client not available");
    }
  } catch (e) {
    console.error("Failed to fetch tours:", e);
  } finally {
    loading.value = false;
  }

  // fetch photos
  try {
    const photos = await searchPhotos({
      query: "budapest walking tour",
      perPage: 12,
      orientation: "landscape",
    });
    tourPhotos.value = photos || [];
  } catch (e) {
    console.error("Failed to fetch photos:", e);
  } finally {
    photosLoading.value = false;
  }
});

const filteredTours = computed(() => {
  if (!tours.value) return [];
  let result = tours.value;

  // category filter
  if (selectedCategory.value !== "all") {
    result = result.filter((t: any) => t.category === selectedCategory.value);
  }

  // search filter
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(
      (t: any) =>
        t.title?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.guides?.name?.toLowerCase().includes(q)
    );
  }

  return result;
});

const activeFiltersCount = computed(() => {
  let count = 0;
  if (selectedCategory.value !== "all") count++;
  if (searchQuery.value) count++;
  return count;
});

function clearFilters() {
  selectedCategory.value = "all";
  searchQuery.value = "";
}

// get photo for tour
const getTourPhoto = (index: number) => {
  if (tourPhotos.value?.[index % tourPhotos.value.length]) {
    return buildImageUrl(
      tourPhotos.value[index % tourPhotos.value.length].urls.raw,
      { width: 600, quality: 80 }
    );
  }
  return "https://images.unsplash.com/photo-1541849546-216549ae216d?w=600&q=80";
};

// helper to get tour display price
const getTourPriceDisplay = (tour: any) => {
  if (tour.category === "free" || (tour.tips_enabled && !tour.base_price_cents)) {
    return { text: "free", subtext: "tip-based" };
  }
  const price = tour.base_price_cents
    ? (tour.base_price_cents / 100).toFixed(0)
    : "35";
  return { text: `€${price}`, subtext: "/person" };
};

// hero from unsplash
const heroImage = computed(() => {
  if (tourPhotos.value?.[0]) {
    return buildImageUrl(tourPhotos.value[0].urls.raw, {
      width: 1920,
      quality: 85,
    });
  }
  return "https://images.unsplash.com/photo-1541849546-216549ae216d?w=1920&q=80";
});
</script>

<template>
  <div class="min-h-screen bg-background">
    <!-- minimal hero -->
    <section class="relative h-[35vh] min-h-[280px]">
      <div class="absolute inset-0">
        <img
          :src="heroImage"
          alt="budapest tours"
          class="h-full w-full object-cover"
        />
        <div
          class="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-background/20"
        />
      </div>
      <div class="container relative flex h-full flex-col justify-end pb-6">
        <Badge variant="info" class="mb-3 w-fit">
          <MapPinIcon class="mr-1 size-3" />
          budapest
        </Badge>
        <h1 class="font-display text-4xl font-bold md:text-5xl">
          explore tours
        </h1>
        <p class="mt-2 max-w-lg text-muted-foreground">
          curated experiences with local guides
        </p>
      </div>
    </section>

    <!-- sticky filter bar -->
    <section
      class="sticky top-16 z-30 border-b border-border bg-background/95 backdrop-blur-md"
    >
      <div class="container py-4">
        <div class="flex items-center gap-3">
          <!-- search -->
          <div class="relative flex-1 max-w-md">
            <SearchIcon
              class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              v-model="searchQuery"
              type="text"
              placeholder="search tours..."
              class="pl-10"
            />
          </div>

          <!-- category pills -->
          <div class="hidden items-center gap-1 md:flex">
            <Button
              v-for="cat in categories"
              :key="cat.id"
              :variant="selectedCategory === cat.id ? 'default' : 'ghost'"
              size="sm"
              @click="selectedCategory = cat.id"
            >
              <component :is="cat.icon" class="mr-1.5 size-3.5" />
              {{ cat.label }}
            </Button>
          </div>

          <!-- mobile filter button -->
          <Sheet>
            <SheetTrigger as-child>
              <Button variant="outline" size="sm" class="md:hidden">
                <SlidersHorizontalIcon class="mr-2 size-4" />
                filters
                <Badge
                  v-if="activeFiltersCount > 0"
                  variant="info"
                  class="ml-2 size-5 justify-center p-0 text-xs"
                >
                  {{ activeFiltersCount }}
                </Badge>
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>filters</SheetTitle>
              </SheetHeader>
              <div class="mt-6 space-y-6">
                <div>
                  <label class="mb-3 block text-sm font-medium">category</label>
                  <div class="flex flex-wrap gap-2">
                    <Button
                      v-for="cat in categories"
                      :key="cat.id"
                      :variant="selectedCategory === cat.id ? 'default' : 'outline'"
                      size="sm"
                      @click="selectedCategory = cat.id"
                    >
                      <component :is="cat.icon" class="mr-1.5 size-3.5" />
                      {{ cat.label }}
                    </Button>
                  </div>
                </div>
              </div>
              <SheetFooter class="mt-8">
                <Button variant="outline" @click="clearFilters" class="w-full">
                  clear filters
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>

          <Separator orientation="vertical" class="mx-2 hidden h-6 md:block" />

          <!-- view toggle -->
          <div class="hidden md:block">
            <div class="flex rounded-lg border border-border p-0.5">
              <Button
                :variant="viewMode === 'grid' ? 'secondary' : 'ghost'"
                size="icon"
                class="size-8"
                @click="viewMode = 'grid'"
              >
                <LayoutGridIcon class="size-4" />
              </Button>
              <Button
                :variant="viewMode === 'list' ? 'secondary' : 'ghost'"
                size="icon"
                class="size-8"
                @click="viewMode = 'list'"
              >
                <ListIcon class="size-4" />
              </Button>
            </div>
          </div>

          <!-- clear button -->
          <Button
            v-if="activeFiltersCount > 0"
            variant="ghost"
            size="sm"
            @click="clearFilters"
            class="hidden md:flex"
          >
            <XIcon class="mr-1.5 size-3.5" />
            clear
          </Button>
        </div>
      </div>
    </section>

    <!-- results count -->
    <section class="border-b border-border bg-muted/30 py-2.5">
      <div class="container">
        <p class="text-sm text-muted-foreground">
          <span class="font-medium text-foreground">{{
            filteredTours.length
          }}</span>
          {{ filteredTours.length === 1 ? "tour" : "tours" }} available
        </p>
      </div>
    </section>

    <!-- tours -->
    <section class="py-10">
      <div class="container">
        <!-- loading -->
        <div v-if="loading" class="flex flex-col items-center justify-center py-20">
          <Spinner size="lg" />
          <p class="mt-4 text-muted-foreground">loading tours...</p>
        </div>

        <!-- empty state -->
        <div
          v-else-if="filteredTours.length === 0"
          class="flex flex-col items-center justify-center py-20 text-center"
        >
          <div
            class="mb-4 flex size-16 items-center justify-center rounded-full bg-muted"
          >
            <SearchIcon class="size-7 text-muted-foreground" />
          </div>
          <h3 class="text-lg font-semibold">no tours found</h3>
          <p class="mt-1 text-sm text-muted-foreground">
            try adjusting your search or filters
          </p>
          <Button @click="clearFilters" variant="outline" class="mt-6">
            clear all filters
          </Button>
        </div>

        <!-- grid view -->
        <div
          v-else-if="viewMode === 'grid'"
          class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          <Card
            v-for="(tour, i) in filteredTours"
            :key="tour.id"
            class="group cursor-pointer overflow-hidden border-border/50 transition-all duration-300 hover:border-primary/30 hover:shadow-lg"
            @click="navigateTo(`/tours/${tour.id}`)"
          >
            <div class="relative aspect-[16/10] overflow-hidden">
              <img
                :src="getTourPhoto(i)"
                :alt="tour.title"
                class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <!-- price badge -->
              <div
                class="absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-bold"
                :class="
                  tour.category === 'free'
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-background/90 backdrop-blur-sm'
                "
              >
                {{ getTourPriceDisplay(tour).text }}
              </div>
            </div>
            <CardContent class="p-4">
              <!-- Tour type badge -->
              <Badge variant="info" class="mb-2 text-xs">
                {{ tour.category || 'paid' }}
              </Badge>
              <div class="flex items-center gap-2 text-xs text-muted-foreground">
                <MapPinIcon class="size-3.5" />
                {{ tour.guides?.city || "budapest" }}
              </div>
              <h3 class="mt-2 line-clamp-1 font-semibold leading-tight">
                {{ tour.title }}
              </h3>
              <p class="mt-1.5 line-clamp-2 text-xs text-muted-foreground">
                {{ tour.description || "explore budapest with a passionate local" }}
              </p>
            </CardContent>
            <CardFooter class="flex items-center justify-between border-t p-4 pt-3">
              <div class="flex items-center gap-1.5 text-xs text-muted-foreground">
                <UsersIcon class="size-3.5" />
                {{ tour.guides?.name || "local guide" }}
              </div>
              <Button variant="ghost" size="sm" class="h-7 text-xs">
                view →
              </Button>
            </CardFooter>
          </Card>
        </div>

        <!-- list view -->
        <div v-else class="space-y-3">
          <Card
            v-for="(tour, i) in filteredTours"
            :key="tour.id"
            class="group cursor-pointer overflow-hidden transition-all duration-300 hover:border-primary/30 hover:shadow-md"
            @click="navigateTo(`/tours/${tour.id}`)"
          >
            <div class="flex">
              <div class="relative w-48 shrink-0 overflow-hidden">
                <img
                  :src="getTourPhoto(i)"
                  :alt="tour.title"
                  class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div class="flex flex-1 flex-col justify-between p-5">
                <div>
                  <div class="flex items-start justify-between">
                    <div>
                      <div class="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPinIcon class="size-3.5" />
                        {{ tour.guides?.city || "budapest" }}
                        <span class="text-border">•</span>
                        <UsersIcon class="size-3.5" />
                        {{ tour.guides?.name || "local guide" }}
                      </div>
                      <h3 class="mt-2 text-lg font-semibold">
                        {{ tour.title }}
                      </h3>
                    </div>
                    <div class="text-right">
                      <div
                        class="text-xl font-bold"
                        :class="tour.category === 'free' ? 'text-accent' : ''"
                      >
                        {{ getTourPriceDisplay(tour).text }}
                      </div>
                      <div class="text-xs text-muted-foreground">
                        {{ getTourPriceDisplay(tour).subtext }}
                      </div>
                    </div>
                  </div>
                  <p class="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {{ tour.description || "explore budapest with a passionate local guide" }}
                  </p>
                </div>
                <div class="mt-4 flex items-center justify-between">
                  <Badge variant="info" class="text-xs">
                    {{ tour.category || "paid" }}
                  </Badge>
                  <Button variant="outline" size="sm">
                    view details →
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  </div>
</template>
