<script setup lang="ts">
import { PlusIcon, CalendarIcon, UsersIcon, LayoutGridIcon, ClockIcon, ImageIcon, MapPinIcon, EyeIcon } from "lucide-vue-next"

definePageMeta({ 
  layout: "saas-app",
  middleware: ["guide-auth"]
})
useSeoMeta({ title: "guide dashboard" })

const { user, guideProfile } = useAuth()
const supabase = useSupabase()

const guide = computed(() => guideProfile.value)

const { data: tours, refresh: refreshTours } = await useAsyncData('guide-tours', async () => {
  if (!guide.value) return []
  const { data } = await supabase.from("tours").select("*").eq("guide_id", guide.value.id).order("created_at", { ascending: false })
  return data || []
})

const { data: timeSlots, refresh: refreshSlots } = await useAsyncData('guide-slots', async () => {
  if (!guide.value) return []
  const { data } = await supabase
    .from("time_slots")
    .select("*, tours!time_slots_tour_id_fkey(*)")
    .eq("guide_id", guide.value.id)
    .gte("start_utc", new Date().toISOString())
    .order("start_utc", { ascending: true })
  return data || []
})

const { data: bookings } = await useAsyncData('guide-bookings', async () => {
  if (!guide.value || !timeSlots.value?.length) return []
  const slotIds = timeSlots.value.map(s => s.id)
  const { data } = await supabase
    .from("bookings")
    .select("*, time_slots(*)")
    .in("time_slot_id", slotIds)
    .eq("status", "confirmed")
  return data || []
})

const activeTab = ref('overview')

const totalBookings = computed(() => bookings.value?.length || 0)
const upcomingSlots = computed(() => timeSlots.value?.length || 0)
const estimatedRevenue = computed(() => {
  if (!bookings.value?.length || !tours.value?.length) return 0
  let total = 0
  bookings.value.forEach(b => {
    const slot = timeSlots.value?.find(s => s.id === b.time_slot_id)
    const tour = tours.value?.find(t => t.id === slot?.tour_id)
    if (tour?.base_price_cents) {
      total += (tour.base_price_cents / 100) * b.party_size
    }
  })
  return total
})

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-us', { weekday: 'short', month: 'short', day: 'numeric' })
}

function formatTime(d) {
  return new Date(d).toLocaleTimeString('en-us', { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="container py-8">
    <div class="mb-8 flex items-center justify-between">
      <div>
        <h1 class="font-display text-3xl font-bold">guide dashboard</h1>
        <p class="mt-2 text-muted-foreground">welcome back, {{ guide?.name }}</p>
      </div>
      <div class="flex gap-3">
        <Button variant="outline" class="hidden sm:flex" @click="navigateTo('/guides/calendar')">
          <CalendarIcon class="mr-2 size-4" />
          calendar
        </Button>
        <Button @click="navigateTo('/guides/tours/create')" class="btn-bounce">
          <PlusIcon class="mr-2 size-4" />
          create tour
        </Button>
      </div>
    </div>

    <div class="mb-8 flex border-b border-border">
      <button 
        @click="activeTab = 'overview'" 
        class="flex items-center gap-2 border-b-2 px-6 py-3 text-sm font-medium transition-colors"
        :class="activeTab === 'overview' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'"
      >
        <LayoutGridIcon class="size-4" /> overview
      </button>
      <button 
        @click="activeTab = 'calendar'" 
        class="flex items-center gap-2 border-b-2 px-6 py-3 text-sm font-medium transition-colors"
        :class="activeTab === 'calendar' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'"
      >
        <CalendarIcon class="size-4" /> schedule
      </button>
      <button 
        @click="activeTab = 'bookings'" 
        class="flex items-center gap-2 border-b-2 px-6 py-3 text-sm font-medium transition-colors"
        :class="activeTab === 'bookings' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'"
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
          <CardContent><div class="text-3xl font-bold">{{ upcomingSlots }}</div></CardContent>
        </Card>
        <Card>
          <CardHeader class="pb-2"><CardTitle class="text-sm font-medium text-muted-foreground">est. revenue</CardTitle></CardHeader>
          <CardContent><div class="text-3xl font-bold">€{{ estimatedRevenue.toFixed(0) }}</div></CardContent>
        </Card>
      </div>

      <div>
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-xl font-semibold small-caps">your tours</h2>
          <Button variant="link" size="sm" asChild><NuxtLink to="/guides/tours">view all</NuxtLink></Button>
        </div>
        
        <div v-if="!tours?.length" class="rounded-xl border border-dashed p-10 text-center">
          <p class="text-muted-foreground">you haven't created any tours yet</p>
          <Button @click="navigateTo('/guides/tours/create')" variant="link" class="mt-2 text-primary">create your first tour</Button>
        </div>

        <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card v-for="tour in tours.slice(0, 6)" :key="tour.id" class="overflow-hidden bg-card card-hover">
            <div class="h-28 bg-muted/50 relative">
              <div v-if="!tour.cover_image" class="flex h-full items-center justify-center text-muted-foreground/30">
                <ImageIcon class="size-8" />
              </div>
              <img v-else :src="tour.cover_image" class="h-full w-full object-cover" />
            </div>
            <CardHeader class="py-3">
              <div class="mb-1 flex items-center justify-between">
                <Badge :variant="tour.is_public ? 'default' : 'secondary'" class="text-xs">{{ tour.is_public ? 'live' : 'draft' }}</Badge>
                <span class="text-xs font-bold uppercase tracking-wider text-muted-foreground">{{ tour.category }}</span>
              </div>
              <CardTitle class="line-clamp-1 text-base">{{ tour.title }}</CardTitle>
            </CardHeader>
            <CardFooter class="flex justify-between border-t bg-muted/20 p-3">
              <span class="text-sm font-bold">{{ tour.base_price_cents ? `€${(tour.base_price_cents/100).toFixed(0)}` : 'free' }}</span>
              <NuxtLink :to="`/tours/${tour.id}`" class="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                <EyeIcon class="size-3" /> view
              </NuxtLink>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>

    <div v-else-if="activeTab === 'calendar'" class="animate-in fade-in slide-in-from-bottom-2">
      <div class="mb-6 flex items-center justify-between">
        <h2 class="text-xl font-semibold small-caps">upcoming schedule</h2>
        <Button size="sm" variant="outline" @click="navigateTo('/guides/tours/create')">
          <PlusIcon class="mr-2 size-4" /> add tour with slots
        </Button>
      </div>

      <div v-if="!timeSlots?.length" class="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
        <CalendarIcon class="mx-auto mb-2 size-8 opacity-50" />
        no upcoming slots scheduled
      </div>

      <div v-else class="space-y-3">
        <div v-for="slot in timeSlots" :key="slot.id" class="flex items-center justify-between rounded-xl border border-border p-4 transition-colors hover:bg-muted/30">
          <div class="flex items-center gap-4">
            <div class="flex flex-col items-center rounded-lg bg-primary/10 px-3 py-1 text-primary">
              <span class="text-xs font-bold uppercase">{{ new Date(slot.start_utc).toLocaleString('en', { weekday: 'short' }) }}</span>
              <span class="text-lg font-bold">{{ new Date(slot.start_utc).getDate() }}</span>
            </div>
            <div>
              <div class="font-medium">{{ slot.tours?.title || 'untitled tour' }}</div>
              <div class="flex items-center gap-3 text-sm text-muted-foreground">
                <span class="flex items-center gap-1"><ClockIcon class="size-3" /> {{ formatTime(slot.start_utc) }}</span>
                <span class="flex items-center gap-1"><UsersIcon class="size-3" /> {{ slot.capacity }} spots</span>
              </div>
            </div>
          </div>
          <Badge :variant="slot.is_open ? 'outline' : 'secondary'">{{ slot.is_open ? 'open' : 'full' }}</Badge>
        </div>
      </div>
    </div>

    <div v-else-if="activeTab === 'bookings'" class="animate-in fade-in slide-in-from-bottom-2">
      <div class="mb-6">
        <h2 class="text-xl font-semibold small-caps">confirmed bookings</h2>
        <p class="text-sm text-muted-foreground mt-1">{{ totalBookings }} total bookings</p>
      </div>

      <div v-if="!bookings?.length" class="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
        <UsersIcon class="mx-auto mb-2 size-8 opacity-50" />
        no bookings yet
      </div>

      <div v-else class="space-y-3">
        <div v-for="booking in bookings" :key="booking.id" class="rounded-xl border border-border p-4">
          <div class="flex items-start justify-between">
            <div>
              <div class="font-medium">{{ booking.guest_name }}</div>
              <div class="text-sm text-muted-foreground">{{ booking.guest_email }}</div>
            </div>
            <Badge variant="default" class="bg-green-500/20 text-green-700 dark:text-green-400">confirmed</Badge>
          </div>
          <div class="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
            <span class="flex items-center gap-1"><CalendarIcon class="size-3" /> {{ formatDate(booking.time_slots?.start_utc) }}</span>
            <span class="flex items-center gap-1"><ClockIcon class="size-3" /> {{ formatTime(booking.time_slots?.start_utc) }}</span>
            <span class="flex items-center gap-1"><UsersIcon class="size-3" /> {{ booking.party_size }} {{ booking.party_size === 1 ? 'person' : 'people' }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
