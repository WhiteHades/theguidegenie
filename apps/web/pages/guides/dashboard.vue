<script setup lang="ts">
import {
  CalendarIcon,
  ClockIcon,
  EyeIcon,
  ImageIcon,
  LayoutGridIcon,
  PlusIcon,
  UsersIcon,
} from "lucide-vue-next";

definePageMeta({
  layout: "saas-app",
  middleware: ["guide-auth"],
});

useSeoMeta({ title: "guide dashboard" });

await callOnce(() => useAuth().fetchUser());

const { guideProfile } = useAuth();
const supabase = useSupabase();
const activeTab = ref<"overview" | "calendar" | "bookings">("overview");

if (!supabase) {
  throw createError({
    statusCode: 500,
    statusMessage: "supabase client unavailable",
  });
}

const guide = computed(() => guideProfile.value);

const { data: tours } = await useAsyncData("guide-tours", async () => {
  if (!supabase || !guide.value) 
return [];
  const { data, error } = await supabase.rpc("get_guide_tours");
  if (error) 
throw error;
  return data || [];
});

const { data: slots } = await useAsyncData("guide-slots", async () => {
  if (!supabase || !guide.value) 
return [];
  const { data, error } = await supabase.rpc("get_guide_slots");
  if (error) 
throw error;
  return data || [];
});

const { data: bookings } = await useAsyncData("guide-bookings", async () => {
  if (!supabase || !guide.value) 
return [];
  const { data, error } = await supabase.rpc("get_guide_bookings");
  if (error) 
throw error;
  return data || [];
});

const estimatedRevenue = computed(() => {
  return (tours.value || []).reduce((sum, tour) => {
    if (!tour.base_price_cents) 
return sum;

    const guestCount = Number(tour.confirmed_guest_count || 0);
    return sum + guestCount * (tour.base_price_cents / 100);
  }, 0);
});

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
</script>

<template>
  <div class="container py-8">
    <div class="mb-8 flex items-center justify-between gap-4">
      <div>
        <h1 class="font-display text-3xl font-bold">guide dashboard</h1>
        <p class="mt-2 text-muted-foreground">welcome back, {{ guide?.name }}</p>
      </div>

      <Button class="btn-bounce" @click="navigateTo('/guides/tours/create')">
        <PlusIcon class="mr-2 size-4" />
        create tour
      </Button>
    </div>

    <div class="mb-8 flex border-b border-border">
      <button
        class="flex items-center gap-2 border-b-2 px-6 py-3 text-sm font-medium transition-colors"
        :class="activeTab === 'overview' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'"
        @click="activeTab = 'overview'"
      >
        <LayoutGridIcon class="size-4" /> overview
      </button>

      <button
        class="flex items-center gap-2 border-b-2 px-6 py-3 text-sm font-medium transition-colors"
        :class="activeTab === 'calendar' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'"
        @click="activeTab = 'calendar'"
      >
        <CalendarIcon class="size-4" /> schedule
      </button>

      <button
        class="flex items-center gap-2 border-b-2 px-6 py-3 text-sm font-medium transition-colors"
        :class="activeTab === 'bookings' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'"
        @click="activeTab = 'bookings'"
      >
        <UsersIcon class="size-4" /> bookings
      </button>
    </div>

    <div v-if="activeTab === 'overview'" class="space-y-8 animate-in fade-in slide-in-from-bottom-2">
      <div class="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader class="pb-2"><CardTitle class="text-sm font-medium text-muted-foreground">active tours</CardTitle></CardHeader>
          <CardContent><div class="text-3xl font-bold">{{ tours?.length || 0 }}</div></CardContent>
        </Card>
        <Card>
          <CardHeader class="pb-2"><CardTitle class="text-sm font-medium text-muted-foreground">upcoming slots</CardTitle></CardHeader>
          <CardContent><div class="text-3xl font-bold">{{ slots?.length || 0 }}</div></CardContent>
        </Card>
        <Card>
          <CardHeader class="pb-2"><CardTitle class="text-sm font-medium text-muted-foreground">est. revenue</CardTitle></CardHeader>
          <CardContent><div class="text-3xl font-bold">EUR {{ estimatedRevenue.toFixed(0) }}</div></CardContent>
        </Card>
      </div>

      <div>
        <div class="mb-4 flex items-center justify-between">
          <h2 class="small-caps text-xl font-semibold">your tours</h2>
          <Button variant="link" size="sm" as-child><NuxtLink to="/guides/tours">view all</NuxtLink></Button>
        </div>

        <div v-if="!tours?.length" class="rounded-xl border border-dashed p-10 text-center">
          <p class="text-muted-foreground">you haven't created any tours yet</p>
          <Button class="mt-2" variant="link" @click="navigateTo('/guides/tours/create')">create your first tour</Button>
        </div>

        <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card v-for="tour in tours.slice(0, 6)" :key="tour.id" class="card-hover overflow-hidden bg-card">
            <div class="relative h-28 bg-muted/50">
              <div v-if="!tour.cover_image" class="flex h-full items-center justify-center text-muted-foreground/30">
                <ImageIcon class="size-8" />
              </div>
              <img v-else :src="tour.cover_image" class="size-full object-cover" :alt="tour.title" />
            </div>

            <CardHeader class="py-3">
              <div class="mb-1 flex items-center justify-between">
                <Badge :variant="tour.is_public ? 'default' : 'secondary'" class="text-xs">
                  {{ tour.is_public ? 'live' : 'draft' }}
                </Badge>
                <span class="text-xs font-bold uppercase tracking-wider text-muted-foreground">{{ tour.category }}</span>
              </div>
              <CardTitle class="line-clamp-1 text-base">{{ tour.title }}</CardTitle>
            </CardHeader>

            <CardFooter class="flex items-center justify-between border-t bg-muted/20 p-3">
              <span class="text-sm font-bold">{{ tour.base_price_cents ? `EUR ${(tour.base_price_cents / 100).toFixed(0)}` : 'free' }}</span>
              <NuxtLink :to="`/tours/${tour.id}`" class="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                <EyeIcon class="size-3" /> view
              </NuxtLink>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>

    <div v-else-if="activeTab === 'calendar'" class="animate-in fade-in slide-in-from-bottom-2">
      <div class="mb-6 flex items-center justify-between">
        <h2 class="small-caps text-xl font-semibold">upcoming schedule</h2>
        <Button size="sm" variant="outline" @click="navigateTo('/guides/tours/create')">
          <PlusIcon class="mr-2 size-4" /> add tour with slots
        </Button>
      </div>

      <div v-if="!slots?.length" class="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
        <CalendarIcon class="mx-auto mb-2 size-8 opacity-50" />
        no upcoming slots scheduled
      </div>

      <div v-else class="space-y-3">
        <div v-for="slot in slots" :key="slot.slot_id" class="flex items-center justify-between rounded-xl border border-border p-4 transition-colors hover:bg-muted/30">
          <div class="flex items-center gap-4">
            <div class="flex flex-col items-center rounded-lg bg-primary/10 px-3 py-1 text-primary">
              <span class="text-xs font-bold uppercase">{{ new Date(slot.start_utc).toLocaleDateString('en-US', { weekday: 'short' }) }}</span>
              <span class="text-lg font-bold">{{ new Date(slot.start_utc).getDate() }}</span>
            </div>
            <div>
              <div class="font-medium">{{ slot.tour_title }}</div>
              <div class="flex items-center gap-3 text-sm text-muted-foreground">
                <span class="flex items-center gap-1"><ClockIcon class="size-3" /> {{ formatTime(slot.start_utc) }}</span>
                <span class="flex items-center gap-1"><UsersIcon class="size-3" /> {{ slot.remaining_capacity }} / {{ slot.capacity }} spots left</span>
              </div>
            </div>
          </div>
          <Badge :variant="slot.remaining_capacity > 0 ? 'outline' : 'secondary'">
            {{ slot.remaining_capacity > 0 ? 'open' : 'full' }}
          </Badge>
        </div>
      </div>
    </div>

    <div v-else class="animate-in fade-in slide-in-from-bottom-2">
      <div class="mb-6">
        <h2 class="small-caps text-xl font-semibold">confirmed bookings</h2>
        <p class="mt-1 text-sm text-muted-foreground">{{ bookings?.length || 0 }} total bookings</p>
      </div>

      <div v-if="!bookings?.length" class="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
        <UsersIcon class="mx-auto mb-2 size-8 opacity-50" />
        no bookings yet
      </div>

      <div v-else class="space-y-3">
        <div v-for="booking in bookings" :key="booking.booking_id" class="rounded-xl border border-border p-4">
          <div class="flex items-start justify-between gap-4">
            <div>
              <div class="font-medium">{{ booking.guest_name }}</div>
              <div class="text-sm text-muted-foreground">{{ booking.guest_email }}</div>
              <div class="mt-1 text-xs text-muted-foreground">{{ booking.tour_title }}</div>
            </div>
            <Badge :variant="booking.status === 'confirmed' ? 'default' : 'secondary'">{{ booking.status }}</Badge>
          </div>

          <div class="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span class="flex items-center gap-1"><CalendarIcon class="size-3" /> {{ formatDate(booking.slot_start_utc) }}</span>
            <span class="flex items-center gap-1"><ClockIcon class="size-3" /> {{ formatTime(booking.slot_start_utc) }}</span>
            <span class="flex items-center gap-1"><UsersIcon class="size-3" /> {{ booking.party_size }} {{ booking.party_size === 1 ? 'person' : 'people' }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
