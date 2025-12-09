<script setup lang="ts">
import { 
  CheckCircleIcon, 
  MailIcon, 
  CalendarIcon, 
  UserIcon, 
  MapPinIcon,
  CopyIcon,
  ExternalLinkIcon,
  SparklesIcon,
} from "lucide-vue-next"
import { toast } from "@/modules/ui/components/toast"

definePageMeta({ layout: "marketing" })
useSeoMeta({ title: "booking confirmed" })

const route = useRoute()
const supabase = useSupabase()

const loading = ref(true)
const booking = ref(null)
const validToken = ref(false)

async function fetchBooking() {
  loading.value = true
  
  const params = route.params
  const bookingId = Array.isArray(params.id) ? params.id[0] : params.id
  const token = route.query.token as string
  
  if (!token) {
    validToken.value = false
    loading.value = false
    return
  }

  try {
    const { data: bookingData, error } = await supabase
      .from("bookings")
      .select("*, time_slots(*, guides(*), tours:guide_id(tours(*)))")
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

onMounted(fetchBooking)

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

function formatTime(dateString: string) {
  return new Date(dateString).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

const editLink = computed(() => {
  if (!booking.value) return ""
  return `${window.location.origin}/book/confirmation/${booking.value.id}?token=${route.query.token}`
})

async function copyLink() {
  try {
    await navigator.clipboard.writeText(editLink.value)
    toast({ title: "link copied!", variant: "success" })
  } catch {
    toast({ title: "failed to copy", variant: "error" })
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-primary/5 to-background">
    <div class="container py-12">
      <div class="mx-auto max-w-2xl">
        <!-- loading -->
        <div v-if="loading" class="py-20 text-center">
          <div class="mx-auto size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p class="mt-4 text-muted-foreground">loading confirmation...</p>
        </div>

        <!-- invalid -->
        <div v-else-if="!validToken || !booking" class="py-20 text-center">
          <div class="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-muted">
            <CalendarIcon class="size-10 text-muted-foreground" />
          </div>
          <h1 class="font-display text-2xl font-bold">booking not found</h1>
          <p class="mt-2 text-muted-foreground">please check your confirmation email for the correct link</p>
          <Button @click="navigateTo('/tours')" variant="outline" class="mt-6 rounded-full">
            browse tours
          </Button>
        </div>

        <!-- success -->
        <div v-else class="animate-in fade-in slide-in-from-bottom-4">
          <!-- header -->
          <div class="mb-8 text-center">
            <div class="mx-auto mb-6 flex size-24 items-center justify-center rounded-full bg-primary/10">
              <CheckCircleIcon class="size-12 text-primary" />
            </div>
            <div class="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <SparklesIcon class="size-3.5" />
              confirmed
            </div>
            <h1 class="font-display text-3xl font-bold">you're all set!</h1>
            <p class="mt-2 text-muted-foreground">your tour has been successfully booked</p>
          </div>

          <!-- booking details -->
          <Card class="mb-6 overflow-hidden border-primary/20">
            <div class="bg-primary/5 p-4">
              <h3 class="small-caps text-xs font-medium tracking-wider text-muted-foreground">booking details</h3>
            </div>
            <CardContent class="space-y-4 p-6">
              <div v-if="booking.time_slots" class="flex items-start gap-3">
                <CalendarIcon class="mt-0.5 size-5 text-primary" />
                <div>
                  <p class="small-caps text-xs text-muted-foreground">date & time</p>
                  <p class="font-medium">{{ formatDate(booking.time_slots.start_utc) }}</p>
                  <p class="text-sm text-muted-foreground">{{ formatTime(booking.time_slots.start_utc) }}</p>
                </div>
              </div>

              <div v-if="booking.time_slots?.guides" class="flex items-start gap-3">
                <UserIcon class="mt-0.5 size-5 text-primary" />
                <div>
                  <p class="small-caps text-xs text-muted-foreground">your guide</p>
                  <p class="font-medium">{{ booking.time_slots.guides.name }}</p>
                  <a
                    :href="`mailto:${booking.time_slots.guides.contact_email}`"
                    class="text-sm text-primary hover:underline"
                  >
                    {{ booking.time_slots.guides.contact_email }}
                  </a>
                </div>
              </div>

              <div class="flex items-start gap-3">
                <MailIcon class="mt-0.5 size-5 text-primary" />
                <div>
                  <p class="small-caps text-xs text-muted-foreground">guest information</p>
                  <p class="font-medium">{{ booking.guest_name }}</p>
                  <p class="text-sm text-muted-foreground">{{ booking.guest_email }}</p>
                  <p v-if="booking.guest_phone" class="text-sm text-muted-foreground">{{ booking.guest_phone }}</p>
                  <p class="mt-1 text-sm">
                    <span class="rounded-full bg-muted px-2 py-0.5 text-xs">
                      {{ booking.party_size }} {{ booking.party_size === 1 ? "person" : "people" }}
                    </span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <!-- what's next -->
          <Card class="mb-6">
            <CardHeader>
              <CardTitle class="small-caps text-sm font-medium tracking-wider">what's next</CardTitle>
            </CardHeader>
            <CardContent class="space-y-3">
              <div class="flex items-center gap-3 text-sm">
                <CheckCircleIcon class="size-4 text-primary" />
                <span>confirmation email sent to {{ booking.guest_email }}</span>
              </div>
              <div class="flex items-center gap-3 text-sm">
                <CheckCircleIcon class="size-4 text-primary" />
                <span>your guide has been notified</span>
              </div>
              <div class="flex items-center gap-3 text-sm">
                <CheckCircleIcon class="size-4 text-primary" />
                <span>arrive 5 minutes early at the meeting point</span>
              </div>
            </CardContent>
          </Card>

          <!-- save link -->
          <Card class="border-accent/20 bg-accent/5">
            <CardContent class="p-4">
              <div class="flex items-start gap-3">
                <ExternalLinkIcon class="mt-0.5 size-5 text-accent" />
                <div class="flex-1">
                  <p class="font-medium text-accent-foreground">save this link</p>
                  <p class="mt-1 text-xs text-muted-foreground">
                    use this link to view or manage your booking
                  </p>
                  <div class="mt-3 flex items-center gap-2">
                    <code class="flex-1 truncate rounded-lg bg-background/50 px-3 py-2 text-xs">
                      {{ editLink }}
                    </code>
                    <Button size="sm" variant="outline" @click="copyLink" class="shrink-0">
                      <CopyIcon class="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <!-- actions -->
          <div class="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button @click="navigateTo('/tours')" variant="outline" class="rounded-full">
              browse more tours
            </Button>
            <Button @click="navigateTo('/')" class="rounded-full btn-bounce">
              back to home
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
