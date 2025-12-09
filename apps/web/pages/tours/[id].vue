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
  LoaderIcon,
  ShipIcon,
  LandmarkIcon,
  BadgeEuroIcon,
  FootprintsIcon,
  CalendarIcon,
  CheckIcon,
  InfoIcon,
  CameraIcon,
  UtensilsIcon,
  GlobeIcon,
} from "lucide-vue-next"
import { toast } from "@/modules/ui/components/toast"
import { Input } from "@/modules/ui/components/input"
import { ScrollArea } from "@/modules/ui/components/scroll-area"

definePageMeta({ layout: "marketing" })

const route = useRoute()
const supabase = useSupabase()
const { user } = useAuth()
const { searchPhotos, buildImageUrl } = useUnsplash()

const loading = ref(true)
const tour = ref(null)
const timeSlots = ref([])
const selectedSlot = ref(null)
const bookingLoading = ref(false)
const showBookingModal = ref(false)
const mapContainer = ref(null)

const bookingForm = reactive({
  guestName: "",
  guestEmail: "",
  guestPhone: "",
  partySize: 1,
})

const categoryIcons = {
  free: FootprintsIcon,
  paid: BadgeEuroIcon,
  boat: ShipIcon,
  museum: LandmarkIcon,
}

const defaultHighlights = [
  { icon: CameraIcon, text: "iconic photo opportunities" },
  { icon: UtensilsIcon, text: "local food recommendations" },
  { icon: GlobeIcon, text: "small groups, big experiences" },
  { icon: HeartIcon, text: "passionate local guides" },
]

const { data: tourPhotos } = await useAsyncData(
  "tour-detail-photos",
  async () => {
    const photos = await searchPhotos({
      query: "budapest landmarks architecture",
      perPage: 4,
      orientation: "landscape",
    })
    return photos
  },
  { server: false },
)

const heroImage = computed(() => {
  if (tourPhotos.value?.[0]) {
    return buildImageUrl(tourPhotos.value[0].urls.raw, { width: 1920, quality: 85 })
  }
  return "https://images.unsplash.com/photo-1541849546-216549ae216d?w=1920&q=85"
})

const isFreeOrTipBased = computed(() => {
  return tour.value?.category === "free" || (tour.value?.tips_enabled && !tour.value?.base_price_cents)
})

const priceDisplay = computed(() => {
  if (isFreeOrTipBased.value) {
    return { main: "free", sub: "tip what you like" }
  }
  const price = tour.value?.base_price_cents ? (tour.value.base_price_cents / 100).toFixed(0) : "35"
  return { main: `€${price}`, sub: "per person" }
})

const totalPrice = computed(() => {
  if (isFreeOrTipBased.value) return 0
  const basePrice = tour.value?.base_price_cents ? tour.value.base_price_cents / 100 : 35
  return basePrice * bookingForm.partySize
})

const groupedSlots = computed(() => {
  const groups = {}
  timeSlots.value.forEach(slot => {
    const date = new Date(slot.start_utc).toLocaleDateString("en-us", { weekday: "short", month: "short", day: "numeric" })
    if (!groups[date]) groups[date] = []
    groups[date].push(slot)
  })
  return groups
})

async function fetchTourDetails() {
  loading.value = true
  const params = route.params
  const tourId = Array.isArray(params.id) ? params.id[0] : params.id

  try {
    const { data: tourData } = await supabase
      .from("tours")
      .select("*, guides(*)")
      .eq("id", tourId)
      .single()

    tour.value = tourData

    if (tour.value) {
      const { data: slotsData } = await supabase
        .from("time_slots")
        .select("*")
        .eq("tour_id", tour.value.id)
        .eq("is_open", true)
        .gte("start_utc", new Date().toISOString())
        .order("start_utc", { ascending: true })

      timeSlots.value = slotsData || []
    }
  } catch (e) {
    console.error("fetch error:", e)
    toast({ title: "error loading tour", variant: "error" })
  } finally {
    loading.value = false
  }
}

function selectSlot(slot) {
  selectedSlot.value = slot
  if (user.value) {
    bookingForm.guestName = user.value.name || ""
    bookingForm.guestEmail = user.value.email || ""
  }
  showBookingModal.value = true
}

async function submitBooking() {
  if (!selectedSlot.value) return
  
  if (!bookingForm.guestName || !bookingForm.guestEmail) {
    toast({ title: "please fill in your name and email", variant: "error" })
    return
  }

  bookingLoading.value = true
  
  try {
    const { data: slotCheck } = await supabase
      .from("time_slots")
      .select("capacity, is_open")
      .eq("id", selectedSlot.value.id)
      .single()

    if (!slotCheck?.is_open || slotCheck.capacity < bookingForm.partySize) {
      toast({ title: "sorry, this slot is no longer available", variant: "error" })
      showBookingModal.value = false
      await fetchTourDetails()
      return
    }

    const editToken = crypto.randomUUID()

    const { error: bookingError } = await supabase.from("bookings").insert({
      time_slot_id: selectedSlot.value.id,
      user_id: user.value?.id || null,
      guest_name: bookingForm.guestName,
      guest_email: bookingForm.guestEmail,
      guest_phone: bookingForm.guestPhone || null,
      party_size: bookingForm.partySize,
      status: "confirmed",
      edit_token: editToken,
    })

    if (bookingError) throw bookingError

    const newCapacity = slotCheck.capacity - bookingForm.partySize
    await supabase
      .from("time_slots")
      .update({ 
        capacity: newCapacity,
        is_open: newCapacity > 0 
      })
      .eq("id", selectedSlot.value.id)

    toast({ 
      title: "booking confirmed!", 
      description: `you're booked for ${formatDate(selectedSlot.value.start_utc)}`,
      variant: "success" 
    })

    showBookingModal.value = false
    selectedSlot.value = null
    
    bookingForm.guestName = ""
    bookingForm.guestEmail = ""
    bookingForm.guestPhone = ""
    bookingForm.partySize = 1

    await fetchTourDetails()

  } catch (e) {
    console.error("booking error:", e)
    toast({ title: "failed to create booking", description: e.message, variant: "error" })
  } finally {
    bookingLoading.value = false
  }
}

onMounted(fetchTourDetails)

useSeoMeta({
  title: () => tour.value?.title || "tour details",
  description: () => tour.value?.description || "book your tour",
})

const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-us", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })
const formatTime = (d) =>
  new Date(d).toLocaleTimeString("en-us", {
    hour: "2-digit",
    minute: "2-digit",
  })
</script>

<template>
  <div class="min-h-screen">
    <div v-if="loading" class="flex min-h-screen items-center justify-center">
      <div class="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>

    <div v-else-if="!tour" class="flex min-h-screen flex-col items-center justify-center text-center">
      <h1 class="text-2xl font-bold">tour not found</h1>
      <p class="mt-2 text-muted-foreground">this tour may have been removed</p>
      <Button @click="navigateTo('/tours')" class="mt-4 btn-bounce rounded-full" variant="outline">
        browse all tours
      </Button>
    </div>

    <template v-else>
      <section class="relative h-[25vh] min-h-[200px]">
        <div class="absolute inset-0">
          <img :src="heroImage" :alt="tour.title" class="h-full w-full object-cover" />
          <div class="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        </div>
        <div class="container relative flex h-full items-end pb-4">
          <button
            @click="navigateTo('/tours')"
            class="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-black/30 px-3 py-1.5 text-xs text-white backdrop-blur-sm hover:bg-black/50 smooth"
          >
            <ArrowLeftIcon class="size-3" />
            back
          </button>
        </div>
      </section>

      <section class="border-b border-border bg-card">
        <div class="container py-4">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div class="flex-1 min-w-0">
              <div class="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant="info" class="text-xs">
                  <component :is="categoryIcons[tour.category] || BadgeEuroIcon" class="mr-1 size-3" />
                  {{ tour.category || 'paid' }}
                </Badge>
                <Badge v-if="isFreeOrTipBased" variant="default" class="text-xs bg-accent text-accent-foreground">
                  <HeartIcon class="mr-1 size-3" />
                  tip-based
                </Badge>
              </div>
              <h1 class="font-display text-2xl font-bold md:text-3xl">{{ tour.title }}</h1>
              <div class="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span class="flex items-center gap-1">
                  <MapPinIcon class="size-3.5" />
                  {{ tour.guides?.city || "budapest" }}
                </span>
                <span class="flex items-center gap-1">
                  <ClockIcon class="size-3.5" />
                  ~3 hours
                </span>
                <span class="flex items-center gap-1">
                  <StarIcon class="size-3.5 fill-accent text-accent" />
                  4.9 (128)
                </span>
              </div>
            </div>
            <div class="text-right shrink-0">
              <div class="text-2xl font-bold" :class="isFreeOrTipBased ? 'text-accent' : ''">
                {{ priceDisplay.main }}
              </div>
              <div class="text-xs text-muted-foreground">{{ priceDisplay.sub }}</div>
            </div>
          </div>
        </div>
      </section>

      <section class="py-6">
        <div class="container">
          <div class="grid gap-6 lg:grid-cols-5">
            <div class="lg:col-span-3 space-y-6">
              <div v-if="isFreeOrTipBased" class="flex items-center gap-3 rounded-lg border border-accent/30 bg-accent/10 p-3 text-sm">
                <HeartIcon class="size-4 shrink-0 text-accent" />
                <span><strong>free to book</strong> – tip your guide what you feel the experience was worth</span>
              </div>

              <div>
                <h2 class="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">about</h2>
                <p class="text-sm leading-relaxed">
                  {{ tour.description || "discover the magic of budapest with a passionate local guide. explore hidden gems, hear authentic stories, and create unforgettable memories on this carefully curated walking experience." }}
                </p>
              </div>

              <div>
                <h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">highlights</h2>
                <div class="grid grid-cols-2 gap-2">
                  <div v-for="h in defaultHighlights" :key="h.text" class="flex items-center gap-2 rounded-lg bg-muted/50 p-2.5 text-sm">
                    <component :is="h.icon" class="size-4 text-primary shrink-0" />
                    <span>{{ h.text }}</span>
                  </div>
                </div>
              </div>

              <div>
                <h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">meeting point</h2>
                <div class="rounded-lg border border-border overflow-hidden">
                  <div ref="mapContainer" class="h-40 bg-muted relative">
                    <iframe
                      v-if="tour.meeting_point"
                      class="h-full w-full border-0"
                      loading="lazy"
                      :src="`https://www.openstreetmap.org/export/embed.html?bbox=19.0,47.47,19.1,47.52&layer=mapnik&marker=47.5,19.05`"
                    />
                    <div v-else class="absolute inset-0 flex items-center justify-center">
                      <MapPinIcon class="size-6 text-muted-foreground/50" />
                    </div>
                  </div>
                  <div class="p-3 bg-card flex items-start gap-2">
                    <MapPinIcon class="size-4 shrink-0 text-primary mt-0.5" />
                    <div>
                      <p class="text-sm font-medium">{{ tour.meeting_point || "heroes' square (hősök tere)" }}</p>
                      <p class="text-xs text-muted-foreground mt-0.5">look for the guide holding a red umbrella</p>
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="tour.guides">
                <h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">your guide</h2>
                <NuxtLink
                  :to="`/guides/${tour.guides.id}`"
                  class="flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary/50"
                >
                  <div class="flex size-10 items-center justify-center rounded-full bg-primary/10">
                    <UserIcon class="size-5 text-primary" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <h3 class="text-sm font-semibold">{{ tour.guides.name }}</h3>
                    <p class="text-xs text-muted-foreground truncate">{{ tour.guides.bio || "passionate local guide" }}</p>
                  </div>
                  <ArrowLeftIcon class="size-4 text-muted-foreground rotate-180" />
                </NuxtLink>
              </div>
            </div>

            <div class="lg:col-span-2">
              <div class="sticky top-20 rounded-xl border border-border bg-card p-4 shadow-lg">
                <h3 class="mb-3 font-semibold flex items-center gap-2">
                  <CalendarIcon class="size-4" />
                  select a time
                </h3>

                <div v-if="timeSlots.length === 0" class="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  <CalendarIcon class="size-6 mx-auto mb-2 opacity-50" />
                  no slots available
                  <p class="text-xs mt-1">check back soon!</p>
                </div>

                <ScrollArea v-else class="h-80">
                  <div class="space-y-3 pr-3">
                    <div v-for="(slots, date) in groupedSlots" :key="date">
                      <div class="text-xs font-medium text-muted-foreground mb-1.5 sticky top-0 bg-card py-1">{{ date }}</div>
                      <div class="space-y-1.5">
                        <button
                          v-for="slot in slots"
                          :key="slot.id"
                          @click="selectSlot(slot)"
                          class="w-full flex items-center justify-between rounded-lg border border-border p-2.5 text-left smooth hover:border-primary hover:bg-primary/5"
                          :class="selectedSlot?.id === slot.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : ''"
                        >
                          <div class="flex items-center gap-2">
                            <ClockIcon class="size-3.5 text-muted-foreground" />
                            <span class="text-sm font-medium">{{ formatTime(slot.start_utc) }}</span>
                          </div>
                          <div class="flex items-center gap-2">
                            <span class="text-xs text-muted-foreground">{{ slot.capacity }} spots</span>
                            <CheckIcon v-if="selectedSlot?.id === slot.id" class="size-4 text-primary" />
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                </ScrollArea>

                <Button 
                  v-if="timeSlots.length > 0"
                  @click="showBookingModal = true" 
                  :disabled="!selectedSlot"
                  class="mt-4 w-full btn-bounce" 
                  size="lg"
                >
                  {{ isFreeOrTipBased ? 'reserve spot' : `book now – ${priceDisplay.main}` }}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </template>

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
            <label class="mb-1.5 block text-sm font-medium">your name</label>
            <Input v-model="bookingForm.guestName" placeholder="full name" class="rounded-lg" />
          </div>

          <div>
            <label class="mb-1.5 block text-sm font-medium">email</label>
            <Input v-model="bookingForm.guestEmail" type="email" placeholder="you@example.com" class="rounded-lg" />
          </div>

          <div>
            <label class="mb-1.5 block text-sm font-medium">phone (optional)</label>
            <Input v-model="bookingForm.guestPhone" type="tel" placeholder="+36 ..." class="rounded-lg" />
          </div>

          <div>
            <label class="mb-1.5 block text-sm font-medium">party size</label>
            <select
              v-model.number="bookingForm.partySize"
              class="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            >
              <option v-for="n in Math.min(selectedSlot?.capacity || 10, 10)" :key="n" :value="n">
                {{ n }} {{ n === 1 ? 'person' : 'people' }}
              </option>
            </select>
          </div>

          <div class="rounded-lg bg-muted/50 p-3">
            <div class="flex items-center justify-between">
              <span class="text-sm text-muted-foreground">{{ isFreeOrTipBased ? 'price' : `${bookingForm.partySize} × ${priceDisplay.main}` }}</span>
              <span class="text-lg font-bold" :class="isFreeOrTipBased ? 'text-accent' : ''">
                {{ isFreeOrTipBased ? 'free' : `€${totalPrice}` }}
              </span>
            </div>
            <p v-if="isFreeOrTipBased" class="mt-1 text-xs text-muted-foreground">
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
