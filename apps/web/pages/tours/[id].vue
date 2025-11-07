<script setup lang="ts">
import { MapPinIcon, UserIcon, CalendarIcon, UsersIcon, ClockIcon } from "lucide-vue-next"
import type { Tour, Guide, TimeSlot } from "database"

definePageMeta({
  layout: "default",
})

const route = useRoute()
const supabase = useSupabase()

// state
const loading = ref(true)
const tour = ref<(Tour & { guide?: Guide }) | null>(null)
const timeSlots = ref<TimeSlot[]>([])

// fetch tour details
async function fetchTourDetails() {
  loading.value = true
  
  const params = route.params as any
  const tourId = Array.isArray(params.id) 
    ? params.id[0] 
    : params.id
  
  try {
    // fetch tour with guide info
    const { data: tourData, error: tourError } = await supabase
      .from("tours")
      .select("*, guides(*)")
      .eq("id", tourId)
      .single()

    if (tourError) throw tourError
    tour.value = tourData

    if (tour.value) {
      // fetch available time slots for this guide
      const { data: slotsData, error: slotsError } = await supabase
        .from("time_slots")
        .select("*")
        .eq("guide_id", tour.value.guide_id)
        .eq("is_open", true)
        .gte("start_utc", new Date().toISOString())
        .order("start_utc", { ascending: true })

      if (slotsError) throw slotsError
      timeSlots.value = slotsData || []
    }
  } catch (error) {
    console.error("error fetching tour:", error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchTourDetails()
})

useSeoMeta({
  title: () => tour.value ? `${tour.value.title} - guidegenie` : "tour details - guidegenie",
  description: () => tour.value?.description || "book your tour with local guides",
})

// format date helper
function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function formatTime(dateString: string) {
  return new Date(dateString).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function getDuration(start: string, end: string) {
  const startDate = new Date(start)
  const endDate = new Date(end)
  const hours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)
  return hours.toFixed(1)
}
</script>

<template>
  <div class="container py-12">
    <!-- loading state -->
    <div v-if="loading" class="py-12 text-center">
      <p class="text-muted-foreground">loading tour details...</p>
    </div>

    <!-- tour not found -->
    <div v-else-if="!tour" class="py-12 text-center">
      <h1 class="text-2xl font-bold">tour not found</h1>
      <p class="mt-2 text-muted-foreground">this tour may have been removed or made private</p>
      <Button @click="navigateTo('/tours')" variant="outline" class="mt-4">
        browse all tours
      </Button>
    </div>

    <!-- tour details -->
    <div v-else class="mx-auto max-w-4xl">
      <Button @click="navigateTo('/tours')" variant="ghost" class="mb-6">
        &larr; back to tours
      </Button>

      <!-- tour header -->
      <div class="mb-8">
        <h1 class="text-4xl font-bold">{{ tour.title }}</h1>
        <p class="mt-4 text-lg text-muted-foreground">
          {{ tour.description || "discover this amazing tour experience" }}
        </p>
      </div>

      <!-- tour info -->
      <div class="mb-8 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>tour details</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div v-if="tour.base_price_cents" class="flex items-center gap-3">
              <span class="text-2xl font-bold">
                €{{ (tour.base_price_cents / 100).toFixed(2) }}
              </span>
              <span class="text-sm text-muted-foreground">per person</span>
            </div>
            <div v-if="tour.guide?.city" class="flex items-center gap-2">
              <MapPinIcon class="size-5 text-muted-foreground" />
              <span>{{ tour.guide.city }}</span>
            </div>
          </CardContent>
        </Card>

        <Card v-if="tour.guide">
          <CardHeader>
            <CardTitle>your guide</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="flex items-center gap-2">
              <UserIcon class="size-5 text-muted-foreground" />
              <span class="font-medium">{{ tour.guide.name }}</span>
            </div>
            <p v-if="tour.guide.bio" class="text-sm text-muted-foreground">
              {{ tour.guide.bio }}
            </p>
            <div class="text-sm">
              <a
                :href="`mailto:${tour.guide.contact_email}`"
                class="text-primary hover:underline"
              >
                contact guide
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- available time slots -->
      <div>
        <h2 class="mb-4 text-2xl font-semibold">available times</h2>
        
        <div v-if="timeSlots.length === 0" class="rounded-lg border border-dashed p-8 text-center">
          <p class="text-muted-foreground">
            no available time slots at the moment. please check back later or contact the guide.
          </p>
        </div>

        <div v-else class="grid gap-4">
          <Card
            v-for="slot in timeSlots"
            :key="slot.id"
            class="cursor-pointer transition-shadow hover:shadow-md"
            @click="navigateTo(`/book/${slot.id}`)"
          >
            <CardHeader>
              <div class="flex items-start justify-between">
                <div>
                  <CardTitle class="text-lg">{{ formatDate(slot.start_utc) }}</CardTitle>
                  <CardDescription class="mt-1">
                    {{ formatTime(slot.start_utc) }} - {{ formatTime(slot.end_utc) }}
                  </CardDescription>
                </div>
                <Badge>available</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div class="flex items-center gap-6 text-sm text-muted-foreground">
                <div class="flex items-center gap-2">
                  <ClockIcon class="size-4" />
                  <span>{{ getDuration(slot.start_utc, slot.end_utc) }} hours</span>
                </div>
                <div class="flex items-center gap-2">
                  <UsersIcon class="size-4" />
                  <span>up to {{ slot.capacity }} people</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button class="w-full">
                book this time slot &rarr;
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  </div>
</template>

