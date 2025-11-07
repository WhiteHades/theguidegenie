<script setup lang="ts">
import { AlertTriangleIcon } from "lucide-vue-next"
import { z } from "zod"
import type { TimeSlot, Tour, Guide } from "database"

definePageMeta({
  layout: "default",
})

useSeoMeta({
  title: "book your tour - guidegenie",
})

const route = useRoute()
const supabase = useSupabase()

// state
const loading = ref(true)
const timeSlot = ref<(TimeSlot & { tour?: Tour; guide?: Guide }) | null>(null)

// fetch time slot details
async function fetchSlotDetails() {
  loading.value = true
  
  const params = route.params as any
  const slotId = Array.isArray(params.slotId) 
    ? params.slotId[0] 
    : params.slotId
  
  try {
    // first get the time slot with guide
    const { data: slotData, error: slotError } = await supabase
      .from("time_slots")
      .select("*, guides(*)")
      .eq("id", slotId)
      .single()

    if (slotError) throw slotError
    
    if (slotData) {
      // check if slot is still available and not in the past
      const now = new Date()
      const slotStart = new Date(slotData.start_utc)
      
      if (slotStart < now || !slotData.is_open) {
        timeSlot.value = null
        return
      }

      // fetch any tour associated with this guide (optional)
      const { data: tourData } = await supabase
        .from("tours")
        .select("*")
        .eq("guide_id", slotData.guide_id)
        .eq("is_public", true)
        .limit(1)
        .single()

      timeSlot.value = { ...slotData, tour: tourData || undefined }
    }
  } catch (error) {
    console.error("error fetching slot:", error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchSlotDetails()
})

// booking form
const formSchema = toTypedSchema(
  z.object({
    root: z.string().optional(),
    guest_name: z.string().min(2, "name must be at least 2 characters"),
    guest_email: z.string().email("invalid email address"),
    guest_phone: z.string().optional(),
    party_size: z.number().min(1, "party size must be at least 1"),
  }),
)

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    guest_name: "",
    guest_email: "",
    guest_phone: "",
    party_size: 1,
  },
})

const { handleSubmit, isSubmitting, errors } = form

const onSubmit = handleSubmit(async (values) => {
  if (!timeSlot.value) {
    form.setFieldError("root", "time slot not found")
    return
  }

  // validate capacity
  if (values.party_size > timeSlot.value.capacity) {
    form.setFieldError("party_size", `maximum capacity is ${timeSlot.value.capacity}`)
    return
  }

  try {
    // generate edit token
    const editToken = crypto.randomUUID()

    // create booking
    const { data: booking, error } = await supabase
      .from("bookings")
      .insert({
        time_slot_id: timeSlot.value.id,
        guest_name: values.guest_name,
        guest_email: values.guest_email,
        guest_phone: values.guest_phone || null,
        party_size: values.party_size,
        status: "confirmed",
        edit_token: editToken,
      })
      .select()
      .single()

    if (error) throw error

    // redirect to confirmation page with booking id and edit token
    navigateTo(`/book/confirmation/${booking.id}?token=${editToken}`)
  } catch (e: any) {
    form.setFieldError("root", e.message || "failed to create booking. please try again.")
  }
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
</script>

<template>
  <div class="container py-12">
    <div class="mx-auto max-w-2xl">
      <!-- loading state -->
      <div v-if="loading" class="py-12 text-center">
        <p class="text-muted-foreground">loading booking details...</p>
      </div>

      <!-- slot not available -->
      <div v-else-if="!timeSlot" class="py-12 text-center">
        <h1 class="text-2xl font-bold">time slot not available</h1>
        <p class="mt-2 text-muted-foreground">
          this time slot may have been filled or is no longer available
        </p>
        <Button @click="navigateTo('/tours')" variant="outline" class="mt-4">
          browse tours
        </Button>
      </div>

      <!-- booking form -->
      <div v-else>
        <h1 class="mb-2 text-3xl font-bold">book your tour</h1>
        <p class="mb-8 text-muted-foreground">
          complete your booking for {{ formatDate(timeSlot.start_utc) }}
        </p>

        <!-- booking details -->
        <Card class="mb-8">
          <CardHeader>
            <CardTitle>booking details</CardTitle>
          </CardHeader>
          <CardContent class="space-y-2">
            <div v-if="timeSlot.tour">
              <p class="text-sm text-muted-foreground">tour</p>
              <p class="font-medium">{{ timeSlot.tour.title }}</p>
            </div>
            <div v-if="timeSlot.guide">
              <p class="text-sm text-muted-foreground">guide</p>
              <p class="font-medium">{{ timeSlot.guide.name }}</p>
            </div>
            <div>
              <p class="text-sm text-muted-foreground">date & time</p>
              <p class="font-medium">{{ formatDate(timeSlot.start_utc) }}</p>
            </div>
            <div>
              <p class="text-sm text-muted-foreground">capacity</p>
              <p class="font-medium">up to {{ timeSlot.capacity }} people</p>
            </div>
          </CardContent>
        </Card>

        <!-- guest information form -->
        <form @submit.prevent="onSubmit" class="space-y-6">
          <Alert v-if="errors.root" variant="error">
            <AlertTriangleIcon class="size-6" />
            <AlertDescription>{{ errors.root }}</AlertDescription>
          </Alert>

          <FormField v-slot="{ componentField }" name="guest_name">
            <FormItem>
              <FormLabel for="guest_name" required>
                full name
              </FormLabel>
              <FormControl>
                <Input v-bind="componentField" autocomplete="name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>

          <FormField v-slot="{ componentField }" name="guest_email">
            <FormItem>
              <FormLabel for="guest_email" required>
                email
              </FormLabel>
              <FormControl>
                <Input v-bind="componentField" type="email" autocomplete="email" />
              </FormControl>
              <FormDescription>
                you'll receive booking confirmation at this email
              </FormDescription>
              <FormMessage />
            </FormItem>
          </FormField>

          <FormField v-slot="{ componentField }" name="guest_phone">
            <FormItem>
              <FormLabel for="guest_phone">
                phone number
              </FormLabel>
              <FormControl>
                <Input v-bind="componentField" type="tel" autocomplete="tel" />
              </FormControl>
              <FormDescription>
                optional - for booking updates
              </FormDescription>
              <FormMessage />
            </FormItem>
          </FormField>

          <FormField v-slot="{ componentField }" name="party_size">
            <FormItem>
              <FormLabel for="party_size" required>
                number of people
              </FormLabel>
              <FormControl>
                <Input
                  v-bind="componentField"
                  type="number"
                  min="1"
                  :max="timeSlot.capacity"
                />
              </FormControl>
              <FormDescription>
                maximum {{ timeSlot.capacity }} people for this slot
              </FormDescription>
              <FormMessage />
            </FormItem>
          </FormField>

          <Button type="submit" :loading="isSubmitting" class="w-full" size="lg">
            confirm booking
          </Button>
        </form>
      </div>
    </div>
  </div>
</template>

