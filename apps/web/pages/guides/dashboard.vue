<script setup lang="ts">
import { PlusIcon, CalendarIcon, UsersIcon } from "lucide-vue-next"
import type { Guide, Tour, TimeSlot, Booking } from "database"

definePageMeta({
  layout: "saas-app",
})

useSeoMeta({
  title: "guide dashboard - guidegenie",
})

const { user, checkIsGuide } = useAuth()
const supabase = useSupabase()

// ensure user is authenticated and is a guide
if (!user.value) {
  navigateTo('/guides/login')
} else {
  const isGuide = await checkIsGuide()
  if (!isGuide) {
    navigateTo('/guides/onboarding')
  }
}

const showCreateTourDialog = ref(false)
const showCreateSlotDialog = ref(false)

const { data: guide, refresh: refreshGuide } = await useAsyncData('guide-profile', async () => {
  if (!user.value) return null
  const { data } = await supabase
    .from("guides")
    .select("*")
    .eq("user_id", user.value.id)
    .single()
  return data
})

const { data: tours, refresh: refreshTours } = await useAsyncData('guide-tours', async () => {
  if (!guide.value) return []
  const { data } = await supabase
    .from("tours")
    .select("*")
    .eq("guide_id", guide.value.id)
    .order("created_at", { ascending: false })
  return data || []
})

const { data: timeSlots, refresh: refreshSlots } = await useAsyncData('guide-slots', async () => {
  if (!guide.value) return []
  const { data } = await supabase
    .from("time_slots")
    .select("*, tours(*)")
    .eq("guide_id", guide.value.id)
    .gte("start_utc", new Date().toISOString())
    .order("start_utc", { ascending: true })
    .limit(10)
  return data || []
})

const { data: bookings, refresh: refreshBookings } = await useAsyncData('guide-bookings', async () => {
  if (!timeSlots.value || timeSlots.value.length === 0) return []
  const slotIds = timeSlots.value.map(s => s.id)
  const { data } = await supabase
    .from("bookings")
    .select("*, time_slots(*)")
    .in("time_slot_id", slotIds)
    .eq("status", "confirmed")
    .order("created_at", { ascending: false })
  return data || []
})

async function fetchGuideData() {
  await Promise.all([refreshGuide(), refreshTours(), refreshSlots(), refreshBookings()])
}

const upcomingSlots = computed(() => timeSlots.value?.filter(s => s.is_open).length || 0)
const totalBookings = computed(() => bookings.value?.length || 0)

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}
</script>

<template>
  <div class="container py-8">
    <div class="mb-8 flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold">guide dashboard</h1>
        <p class="mt-2 text-muted-foreground">
          welcome back, {{ guide?.name || user?.name }}
        </p>
      </div>
      <div class="flex gap-2">
        <Button @click="showCreateTourDialog = true" variant="default">
          <PlusIcon class="mr-2 size-4" />
          create tour
        </Button>
        <Button @click="showCreateSlotDialog = true" variant="outline">
          <CalendarIcon class="mr-2 size-4" />
          add time slot
        </Button>
      </div>
    </div>

    <!-- stats -->
    <div class="mb-8 grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">total tours</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ tours?.length || 0 }}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">upcoming slots</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ upcomingSlots }}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">total bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ totalBookings }}</div>
        </CardContent>
      </Card>
    </div>

    <!-- main content -->
    <div class="grid gap-8 lg:grid-cols-2">
      <!-- tours section -->
      <div>
        <h2 class="mb-4 text-xl font-semibold">your tours</h2>
        <div v-if="!tours || tours.length === 0" class="rounded-lg border border-dashed p-8 text-center">
          <p class="text-muted-foreground">no tours yet</p>
          <Button @click="showCreateTourDialog = true" variant="link" class="mt-2">
            create your first tour
          </Button>
        </div>
        <div v-else class="space-y-4">
          <Card v-for="tour in tours" :key="tour.id">
            <CardHeader>
              <CardTitle class="text-lg">{{ tour.title }}</CardTitle>
              <CardDescription>{{ tour.description }}</CardDescription>
            </CardHeader>
            <CardContent>
              <div class="flex items-center gap-4 text-sm text-muted-foreground">
                <span v-if="tour.base_price_cents">
                  €{{ (tour.base_price_cents / 100).toFixed(2) }}
                </span>
                <Badge>
                  {{ tour.is_public ? "public" : "private" }}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <!-- bookings section -->
      <div>
        <h2 class="mb-4 text-xl font-semibold">recent bookings</h2>
        <div v-if="!bookings || bookings.length === 0" class="rounded-lg border border-dashed p-8 text-center">
          <p class="text-muted-foreground">no bookings yet</p>
        </div>
        <div v-else class="space-y-4">
          <Card v-for="booking in bookings.slice(0, 5)" :key="booking.id">
            <CardHeader>
              <CardTitle class="text-base">{{ booking.guest_name }}</CardTitle>
              <CardDescription>{{ booking.guest_email }}</CardDescription>
            </CardHeader>
            <CardContent>
              <div class="flex items-center gap-2 text-sm text-muted-foreground">
                <UsersIcon class="size-4" />
                <span>{{ booking.party_size }} {{ booking.party_size === 1 ? "person" : "people" }}</span>
              </div>
              <p class="mt-2 text-xs text-muted-foreground">
                booked {{ new Date(booking.created_at).toLocaleDateString() }}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>

    <!-- upcoming time slots -->
    <div class="mt-8">
      <h2 class="mb-4 text-xl font-semibold">upcoming time slots</h2>
      <div v-if="!timeSlots || timeSlots.length === 0" class="rounded-lg border border-dashed p-8 text-center">
        <p class="text-muted-foreground">no upcoming slots</p>
        <Button @click="showCreateSlotDialog = true" variant="link" class="mt-2">
          add your first time slot
        </Button>
      </div>
      <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card v-for="slot in timeSlots" :key="slot.id">
          <CardHeader>
            <CardTitle class="text-sm">{{ formatDate(slot.start_utc) }}</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="space-y-1 text-sm">
              <p class="text-muted-foreground">capacity: {{ slot.capacity }}</p>
              <Badge>
                {{ slot.is_open ? "open" : "closed" }}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- create tour dialog -->
    <GuidesCreateTourDialog
      v-model:open="showCreateTourDialog"
      :guide-id="guide?.id"
      @created="fetchGuideData"
    />

    <!-- create slot dialog -->
    <GuidesCreateSlotDialog
      v-model:open="showCreateSlotDialog"
      :guide-id="guide?.id"
      :tours="tours"
      @created="fetchGuideData"
    />
  </div>
</template>

