<script setup lang="ts">
import { CheckCircle2Icon, MailIcon, CalendarIcon, UserIcon } from "lucide-vue-next"
import type { Booking, TimeSlot, Guide } from "database"

definePageMeta({
  layout: "default",
})

useSeoMeta({
  title: "booking confirmed - guidegenie",
})

const route = useRoute()
const supabase = useSupabase()

// state
const loading = ref(true)
const booking = ref<(Booking & { time_slot?: TimeSlot & { guide?: Guide } }) | null>(null)
const validToken = ref(false)

// fetch booking details
async function fetchBooking() {
  loading.value = true
  
  const params = route.params as any
  const bookingId = Array.isArray(params.id) 
    ? params.id[0] 
    : params.id
  
  try {
    const token = route.query.token as string
    
    if (!token) {
      validToken.value = false
      loading.value = false
      return
    }

    const { data: bookingData, error } = await supabase
      .from("bookings")
      .select("*, time_slots(*, guides(*))")
      .eq("id", bookingId)
      .eq("edit_token", token)
      .single()

    if (error) throw error

    booking.value = bookingData
    validToken.value = true
  } catch (error) {
    console.error("error fetching booking:", error)
    validToken.value = false
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchBooking()
})

// format date helper
function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// generate edit link
const editLink = computed(() => {
  if (!booking.value) return ""
  return `${window.location.origin}/book/confirmation/${booking.value.id}?token=${route.query.token}`
})
</script>

<template>
  <div class="container py-12">
    <div class="mx-auto max-w-2xl">
      <!-- loading state -->
      <div v-if="loading" class="py-12 text-center">
        <p class="text-muted-foreground">loading confirmation...</p>
      </div>

      <!-- invalid or no token -->
      <div v-else-if="!validToken || !booking" class="py-12 text-center">
        <h1 class="text-2xl font-bold">booking not found</h1>
        <p class="mt-2 text-muted-foreground">
          please check your confirmation email for the correct link
        </p>
        <Button @click="navigateTo('/tours')" variant="outline" class="mt-4">
          browse tours
        </Button>
      </div>

      <!-- confirmation success -->
      <div v-else>
        <div class="mb-8 text-center">
          <div class="mb-4 flex justify-center">
            <div class="rounded-full bg-green-100 p-4 dark:bg-green-900">
              <CheckCircle2Icon class="size-12 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <h1 class="text-3xl font-bold">booking confirmed!</h1>
          <p class="mt-2 text-muted-foreground">
            your tour has been successfully booked
          </p>
        </div>

        <!-- booking details -->
        <Card class="mb-6">
          <CardHeader>
            <CardTitle>booking details</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div v-if="booking.time_slot" class="flex items-start gap-3">
              <CalendarIcon class="mt-0.5 size-5 text-muted-foreground" />
              <div>
                <p class="text-sm text-muted-foreground">date & time</p>
                <p class="font-medium">
                  {{ formatDate(booking.time_slot.start_utc) }}
                </p>
              </div>
            </div>

            <div v-if="booking.time_slot?.guide" class="flex items-start gap-3">
              <UserIcon class="mt-0.5 size-5 text-muted-foreground" />
              <div>
                <p class="text-sm text-muted-foreground">your guide</p>
                <p class="font-medium">{{ booking.time_slot.guide.name }}</p>
                <a
                  :href="`mailto:${booking.time_slot.guide.contact_email}`"
                  class="text-sm text-primary hover:underline"
                >
                  {{ booking.time_slot.guide.contact_email }}
                </a>
              </div>
            </div>

            <div class="flex items-start gap-3">
              <MailIcon class="mt-0.5 size-5 text-muted-foreground" />
              <div>
                <p class="text-sm text-muted-foreground">guest information</p>
                <p class="font-medium">{{ booking.guest_name }}</p>
                <p class="text-sm">{{ booking.guest_email }}</p>
                <p v-if="booking.guest_phone" class="text-sm">{{ booking.guest_phone }}</p>
                <p class="text-sm text-muted-foreground">
                  party size: {{ booking.party_size }} {{ booking.party_size === 1 ? "person" : "people" }}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- next steps -->
        <Card class="mb-6">
          <CardHeader>
            <CardTitle>next steps</CardTitle>
          </CardHeader>
          <CardContent class="space-y-2 text-sm">
            <p>✓ confirmation email sent to {{ booking.guest_email }}</p>
            <p>✓ your guide has been notified</p>
            <p>✓ save this page link to manage your booking</p>
          </CardContent>
        </Card>

        <!-- edit link -->
        <Alert>
          <AlertDescription>
            <p class="mb-2 font-medium">important: save this link</p>
            <p class="text-sm">
              you can use this link to view or cancel your booking. it has also been sent to your email.
            </p>
            <div class="mt-3 rounded-md bg-muted p-3">
              <code class="text-xs break-all">{{ editLink }}</code>
            </div>
          </AlertDescription>
        </Alert>

        <!-- actions -->
        <div class="mt-8 flex justify-center gap-4">
          <Button @click="navigateTo('/tours')" variant="outline">
            browse more tours
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

