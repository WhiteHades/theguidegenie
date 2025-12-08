<script setup lang="ts">
  // @ts-nocheck
  import {
    MapPinIcon,
    UserIcon,
    UsersIcon,
    ClockIcon,
    ArrowLeftIcon,
    StarIcon,
    HeartIcon,
    CheckCircleIcon,
    AlertCircleIcon,
    LoaderIcon,
    ShipIcon,
    LandmarkIcon,
    BadgeEuroIcon,
    FootprintsIcon,
  } from "lucide-vue-next";
  import { toast } from "@/modules/ui/components/toast";

  definePageMeta({ layout: "marketing" });

  const route = useRoute();
  const supabase = useSupabase();
  const { user } = useAuth();
  const { searchPhotos, buildImageUrl } = useUnsplash();

  const loading = ref(true);
  const tour = ref(null);
  const timeSlots = ref([]);
  const selectedSlot = ref(null);
  const bookingLoading = ref(false);
  const showBookingModal = ref(false);

  // booking form
  const bookingForm = reactive({
    guestName: "",
    guestEmail: "",
    guestPhone: "",
    partySize: 1,
  });

  // category icons map
  const categoryIcons = {
    free: FootprintsIcon,
    paid: BadgeEuroIcon,
    boat: ShipIcon,
    museum: LandmarkIcon,
  };

  // fetch budapest photos
  const { data: tourPhotos } = await useAsyncData(
    "tour-detail-photos",
    async () => {
      const photos = await searchPhotos({
        query: "budapest landmarks",
        perPage: 4,
        orientation: "landscape",
      });
      return photos;
    },
    { server: false },
  );

  const heroImage = computed(() => {
    if (tourPhotos.value?.[0]) {
      return buildImageUrl(tourPhotos.value[0].urls.raw, {
        width: 1920,
        quality: 85,
      });
    }
    return "https://images.unsplash.com/photo-1541849546-216549ae216d?w=1920&q=85";
  });

  const isFreeOrTipBased = computed(() => {
    return tour.value?.category === "free" || (tour.value?.tips_enabled && !tour.value?.base_price_cents);
  });

  const priceDisplay = computed(() => {
    if (isFreeOrTipBased.value) {
      return { main: "free", sub: "tip what you like" };
    }
    const price = tour.value?.base_price_cents ? (tour.value.base_price_cents / 100).toFixed(0) : "35";
    return { main: `€${price}`, sub: "per person" };
  });

  const totalPrice = computed(() => {
    if (isFreeOrTipBased.value) return 0;
    const basePrice = tour.value?.base_price_cents ? tour.value.base_price_cents / 100 : 35;
    return basePrice * bookingForm.partySize;
  });

  async function fetchTourDetails() {
    loading.value = true;
    const params = route.params;
    const tourId = Array.isArray(params.id) ? params.id[0] : params.id;

    try {
      const { data: tourData } = await supabase
        .from("tours")
        .select("*, guides(*)")
        .eq("id", tourId)
        .single();

      tour.value = tourData;

      if (tour.value) {
        const { data: slotsData } = await supabase
          .from("time_slots")
          .select("*")
          .eq("guide_id", tour.value.guide_id)
          .eq("is_open", true)
          .gte("start_utc", new Date().toISOString())
          .order("start_utc", { ascending: true });

        timeSlots.value = slotsData || [];
      }
    } catch (e) {
      console.error("fetch error:", e);
      toast({ title: "error loading tour", variant: "error" });
    } finally {
      loading.value = false;
    }
  }

  function selectSlot(slot) {
    selectedSlot.value = slot;
    // pre-fill user data if logged in
    if (user.value) {
      bookingForm.guestName = user.value.name || "";
      bookingForm.guestEmail = user.value.email || "";
    }
    showBookingModal.value = true;
  }

  async function submitBooking() {
    if (!selectedSlot.value) return;
    
    // basic validation
    if (!bookingForm.guestName || !bookingForm.guestEmail) {
      toast({ title: "please fill in your name and email", variant: "error" });
      return;
    }

    bookingLoading.value = true;
    
    try {
      // check slot still has capacity
      const { data: slotCheck } = await supabase
        .from("time_slots")
        .select("capacity, is_open")
        .eq("id", selectedSlot.value.id)
        .single();

      if (!slotCheck?.is_open || slotCheck.capacity < bookingForm.partySize) {
        toast({ title: "sorry, this slot is no longer available", variant: "error" });
        showBookingModal.value = false;
        await fetchTourDetails();
        return;
      }

      // generate edit token for guest bookings
      const editToken = crypto.randomUUID();

      // create booking
      const { error: bookingError } = await supabase.from("bookings").insert({
        time_slot_id: selectedSlot.value.id,
        user_id: user.value?.id || null,
        guest_name: bookingForm.guestName,
        guest_email: bookingForm.guestEmail,
        guest_phone: bookingForm.guestPhone || null,
        party_size: bookingForm.partySize,
        status: "confirmed",
        edit_token: editToken,
      });

      if (bookingError) throw bookingError;

      // update slot capacity
      const newCapacity = slotCheck.capacity - bookingForm.partySize;
      await supabase
        .from("time_slots")
        .update({ 
          capacity: newCapacity,
          is_open: newCapacity > 0 
        })
        .eq("id", selectedSlot.value.id);

      toast({ 
        title: "booking confirmed!", 
        description: `you're booked for ${formatDate(selectedSlot.value.start_utc)}`,
        variant: "success" 
      });

      showBookingModal.value = false;
      selectedSlot.value = null;
      
      // reset form
      bookingForm.guestName = "";
      bookingForm.guestEmail = "";
      bookingForm.guestPhone = "";
      bookingForm.partySize = 1;

      // refresh slots
      await fetchTourDetails();

    } catch (e) {
      console.error("booking error:", e);
      toast({ title: "failed to create booking", description: e.message, variant: "error" });
    } finally {
      bookingLoading.value = false;
    }
  }

  onMounted(fetchTourDetails);

  useSeoMeta({
    title: () => tour.value?.title || "tour details",
    description: () => tour.value?.description || "book your tour",
  });

  const formatDate = (d) =>
    new Date(d).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  const formatTime = (d) =>
    new Date(d).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
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
      v-else-if="!tour"
      class="flex min-h-screen flex-col items-center justify-center text-center"
    >
      <h1 class="text-2xl font-bold">tour not found</h1>
      <p class="mt-2 text-muted-foreground">this tour may have been removed</p>
      <Button
        @click="navigateTo('/tours')"
        class="mt-4 btn-bounce rounded-full"
        variant="outline"
      >
        browse all tours
      </Button>
    </div>

    <!-- tour content -->
    <template v-else>
      <!-- hero -->
      <section class="relative h-[50vh] min-h-[400px]">
        <div class="absolute inset-0">
          <img
            :src="heroImage"
            :alt="tour.title"
            class="h-full w-full object-cover"
          />
          <div
            class="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent"
          />
        </div>
        <div class="container relative flex h-full flex-col justify-end pb-8">
          <button
            @click="navigateTo('/tours')"
            class="mb-4 inline-flex items-center gap-2 text-sm text-white/80 hover:text-white smooth"
          >
            <ArrowLeftIcon class="size-4" />
            back to tours
          </button>
          <!-- category badge -->
          <div class="mb-3 flex items-center gap-2">
            <span class="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-sm font-medium text-white backdrop-blur-sm">
              <component :is="categoryIcons[tour.category] || BadgeEuroIcon" class="size-4" />
              {{ tour.category || 'paid' }} tour
            </span>
            <span 
              v-if="isFreeOrTipBased"
              class="flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-sm font-bold text-accent-foreground"
            >
              <HeartIcon class="size-4" />
              tip-based
            </span>
          </div>
          <h1 class="font-display text-4xl font-bold text-white md:text-5xl">
            {{ tour.title }}
          </h1>
          <div class="mt-4 flex flex-wrap items-center gap-4 text-white/80">
            <span class="flex items-center gap-2">
              <MapPinIcon class="size-4" />
              {{ tour.guides?.city || "budapest" }}
            </span>
            <span class="flex items-center gap-2">
              <StarIcon class="size-4 fill-accent text-accent" />
              4.9 rating
            </span>
          </div>
        </div>
      </section>

      <!-- content -->
      <section class="py-12">
        <div class="container">
          <div class="grid gap-12 lg:grid-cols-3">
            <!-- main content -->
            <div class="lg:col-span-2 space-y-12">
              <!-- free tour notice -->
              <div 
                v-if="isFreeOrTipBased"
                class="flex items-start gap-4 rounded-2xl border border-accent/30 bg-accent/10 p-6"
              >
                <HeartIcon class="size-6 shrink-0 text-accent" />
                <div>
                  <h3 class="font-semibold text-accent-foreground">free to book, tip what you like</h3>
                  <p class="mt-1 text-sm text-muted-foreground">
                    this tour is completely free to join. at the end, you can tip your guide whatever amount you feel the experience was worth.
                  </p>
                </div>
              </div>

              <div class="prose prose-lg max-w-none">
                <h2 class="small-caps font-display text-2xl font-bold">about this tour</h2>
                <p class="text-muted-foreground">
                  {{
                    tour.description ||
                    "discover the magic of budapest with a passionate local guide. explore hidden gems, hear authentic stories, and create unforgettable memories."
                  }}
                </p>
              </div>

              <!-- meeting point -->
              <div v-if="tour.meeting_point">
                <h2 class="small-caps font-display text-2xl font-bold">meeting point</h2>
                <div class="mt-4 flex items-start gap-3 rounded-2xl border border-border bg-card p-6">
                  <MapPinIcon class="size-5 shrink-0 text-primary" />
                  <p class="text-muted-foreground">{{ tour.meeting_point }}</p>
                </div>
              </div>

              <!-- guide -->
              <div v-if="tour.guides">
                <h2 class="small-caps font-display text-2xl font-bold">your guide</h2>
                <NuxtLink
                  :to="`/guides/${tour.guides.id}`"
                  class="mt-4 flex items-start gap-4 rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/50 hover:bg-primary/5"
                >
                  <div
                    class="flex size-16 items-center justify-center rounded-full bg-primary/10"
                  >
                    <UserIcon class="size-8 text-primary" />
                  </div>
                  <div class="flex-1">
                    <h3 class="text-lg font-semibold">
                      {{ tour.guides.name }}
                    </h3>
                    <p class="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {{ tour.guides.bio || "passionate local guide" }}
                    </p>
                    <span class="mt-2 inline-block text-sm font-medium text-primary">view profile →</span>
                  </div>
                </NuxtLink>
              </div>
            </div>

            <!-- booking sidebar -->
            <div class="lg:col-span-1">
              <div
                class="sticky top-24 rounded-2xl border border-border bg-card p-6 shadow-lg"
              >
                <div class="mb-6 flex items-baseline gap-2">
                  <span 
                    class="text-3xl font-bold"
                    :class="isFreeOrTipBased ? 'text-accent' : ''"
                  >{{ priceDisplay.main }}</span>
                  <span class="text-muted-foreground">{{ priceDisplay.sub }}</span>
                </div>

                <h3 class="small-caps mb-4 text-sm font-semibold tracking-wider">available times</h3>

                <div
                  v-if="timeSlots.length === 0"
                  class="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground"
                >
                  no slots available. check back soon!
                </div>

                <div v-else class="space-y-3">
                  <button
                    v-for="slot in timeSlots.slice(0, 4)"
                    :key="slot.id"
                    @click="selectSlot(slot)"
                    class="w-full rounded-xl border border-border p-4 text-left smooth hover:border-primary hover:bg-primary/5"
                    :class="selectedSlot?.id === slot.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : ''"
                  >
                    <div class="font-medium">
                      {{ formatDate(slot.start_utc) }}
                    </div>
                    <div
                      class="mt-1 flex items-center gap-4 text-sm text-muted-foreground"
                    >
                      <span class="flex items-center gap-1">
                        <ClockIcon class="size-3" />
                        {{ formatTime(slot.start_utc) }}
                      </span>
                      <span class="flex items-center gap-1">
                        <UsersIcon class="size-3" />
                        {{ slot.capacity }} spots
                      </span>
                    </div>
                  </button>
                </div>

                <Button 
                  v-if="timeSlots.length > 0"
                  @click="showBookingModal = true" 
                  :disabled="!selectedSlot"
                  class="mt-6 w-full btn-bounce" 
                  size="lg"
                >
                  {{ isFreeOrTipBased ? 'reserve spot' : 'book now' }}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </template>

    <!-- booking modal -->
    <Dialog v-model:open="showBookingModal">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle class="font-display text-xl">complete your booking</DialogTitle>
          <DialogDescription v-if="selectedSlot">
            {{ formatDate(selectedSlot.start_utc) }} at {{ formatTime(selectedSlot.start_utc) }}
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4 py-4">
          <div>
            <label class="mb-2 block text-sm font-medium">your name</label>
            <input
              v-model="bookingForm.guestName"
              type="text"
              placeholder="full name"
              class="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label class="mb-2 block text-sm font-medium">email</label>
            <input
              v-model="bookingForm.guestEmail"
              type="email"
              placeholder="you@example.com"
              class="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label class="mb-2 block text-sm font-medium">phone (optional)</label>
            <input
              v-model="bookingForm.guestPhone"
              type="tel"
              placeholder="+36 ..."
              class="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label class="mb-2 block text-sm font-medium">party size</label>
            <select
              v-model.number="bookingForm.partySize"
              class="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            >
              <option v-for="n in Math.min(selectedSlot?.capacity || 10, 10)" :key="n" :value="n">
                {{ n }} {{ n === 1 ? 'person' : 'people' }}
              </option>
            </select>
          </div>

          <!-- price summary -->
          <div class="rounded-xl bg-muted/50 p-4">
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">{{ isFreeOrTipBased ? 'price' : `${bookingForm.partySize} × ${priceDisplay.main}` }}</span>
              <span class="text-lg font-bold" :class="isFreeOrTipBased ? 'text-accent' : ''">
                {{ isFreeOrTipBased ? 'free' : `€${totalPrice}` }}
              </span>
            </div>
            <p v-if="isFreeOrTipBased" class="mt-2 text-xs text-muted-foreground">
              tip your guide at the end of the tour
            </p>
          </div>
        </div>

        <DialogFooter class="flex-col gap-2 sm:flex-row">
          <Button variant="outline" @click="showBookingModal = false" class="w-full sm:w-auto">
            cancel
          </Button>
          <Button 
            @click="submitBooking" 
            :disabled="bookingLoading || !bookingForm.guestName || !bookingForm.guestEmail"
            class="w-full btn-bounce sm:w-auto"
          >
            <LoaderIcon v-if="bookingLoading" class="mr-2 size-4 animate-spin" />
            <CheckCircleIcon v-else class="mr-2 size-4" />
            {{ bookingLoading ? 'booking...' : 'confirm booking' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
