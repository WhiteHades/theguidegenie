<script setup lang="ts">
import {
  UserIcon,
  MailIcon,
  PhoneIcon,
  UsersIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  TicketIcon,
} from "lucide-vue-next"
import { z } from "zod"
import { toast } from "@/modules/ui/components/toast"

definePageMeta({ layout: "marketing" })
useSeoMeta({ title: "book your tour" })

const route = useRoute()
const supabase = useSupabase()
const { user } = useAuth()

const loading = ref(true)
const timeSlot = ref(null)
const tour = ref(null)

async function fetchSlotDetails() {
  loading.value = true
  
  const params = route.params
  const slotId = Array.isArray(params.slotId) ? params.slotId[0] : params.slotId
  
  try {
    const { data: slotData, error: slotError } = await supabase
      .from("time_slots")
      .select("*, guides(*)")
      .eq("id", slotId)
      .single()

    if (slotError) throw slotError
    
    if (slotData) {
      const now = new Date()
      const slotStart = new Date(slotData.start_utc)
      
      if (slotStart < now || !slotData.is_open || slotData.capacity <= 0) {
        timeSlot.value = null
        return
      }

      timeSlot.value = slotData

      // fetch tour for this guide
      const { data: tourData } = await supabase
        .from("tours")
        .select("*")
        .eq("guide_id", slotData.guide_id)
        .eq("is_public", true)
        .limit(1)
        .single()

      tour.value = tourData
    }
  } catch (error) {
    console.error("error fetching slot:", error)
  } finally {
    loading.value = false
  }
}

onMounted(fetchSlotDetails)

// form
const formSchema = toTypedSchema(
  z.object({
    guest_name: z.string().min(2, "name must be at least 2 characters"),
    guest_email: z.string().email("enter a valid email"),
    guest_phone: z.string().optional(),
    party_size: z.number().min(1, "at least 1 person required"),
  }),
)

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    guest_name: user.value?.name || "",
    guest_email: user.value?.email || "",
    guest_phone: "",
    party_size: 1,
  },
})

const { handleSubmit, isSubmitting, setFieldError, values } = form

const isFreeOrTipBased = computed(() => {
  return tour.value?.category === "free" || (tour.value?.tips_enabled && !tour.value?.base_price_cents)
})

const pricePerPerson = computed(() => {
  if (isFreeOrTipBased.value) return 0
  return tour.value?.base_price_cents ? tour.value.base_price_cents / 100 : 35
})

const totalPrice = computed(() => pricePerPerson.value * values.party_size)

const onSubmit = handleSubmit(async (values) => {
  if (!timeSlot.value) {
    toast({ title: "slot not available", variant: "error" })
    return
  }

  if (values.party_size > timeSlot.value.capacity) {
    setFieldError("party_size", `only ${timeSlot.value.capacity} spots available`)
    return
  }

  try {
    const editToken = crypto.randomUUID()

    const { data: booking, error } = await supabase
      .from("bookings")
      .insert({
        time_slot_id: timeSlot.value.id,
        user_id: user.value?.id || null,
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

    // update slot capacity
    const newCapacity = timeSlot.value.capacity - values.party_size
    await supabase
      .from("time_slots")
      .update({ 
        capacity: newCapacity,
        is_open: newCapacity > 0 
      })
      .eq("id", timeSlot.value.id)

    toast({ title: "booking confirmed!", variant: "success" })
    navigateTo(`/book/confirmation/${booking.id}?token=${editToken}`)
  } catch (e: any) {
    setFieldError("guest_name", e.message || "booking failed")
    toast({ title: "booking failed", description: e.message, variant: "error" })
  }
})

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    weekday: "long",
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
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-primary/5 to-background">
    <div class="container py-12">
      <div class="mx-auto max-w-2xl">
        <!-- back button -->
        <button
          @click="navigateTo('/tours')"
          class="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground smooth"
        >
          <ArrowLeftIcon class="size-4" />
          back to tours
        </button>

        <!-- loading -->
        <div v-if="loading" class="py-20 text-center">
          <div class="mx-auto size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p class="mt-4 text-muted-foreground">loading booking details...</p>
        </div>

        <!-- not available -->
        <div v-else-if="!timeSlot" class="py-20 text-center">
          <div class="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-muted">
            <CalendarIcon class="size-10 text-muted-foreground" />
          </div>
          <h1 class="font-display text-2xl font-bold">slot not available</h1>
          <p class="mt-2 text-muted-foreground">this time slot may have been filled or is no longer available</p>
          <Button @click="navigateTo('/tours')" variant="outline" class="mt-6 rounded-full">
            browse tours
          </Button>
        </div>

        <!-- booking form -->
        <div v-else class="animate-in fade-in slide-in-from-bottom-4">
          <!-- header -->
          <div class="mb-8">
            <div class="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <TicketIcon class="size-3.5" />
              booking
            </div>
            <h1 class="font-display text-3xl font-bold">complete your booking</h1>
            <p class="mt-2 text-muted-foreground">you're almost there!</p>
          </div>

          <!-- booking details card -->
          <Card class="mb-8 overflow-hidden border-primary/20">
            <div class="bg-primary/5 p-4">
              <h3 class="small-caps text-xs font-medium tracking-wider text-muted-foreground">booking details</h3>
            </div>
            <CardContent class="grid gap-4 p-6 sm:grid-cols-2">
              <div v-if="tour" class="flex items-start gap-3">
                <TicketIcon class="mt-0.5 size-5 text-primary" />
                <div>
                  <p class="small-caps text-xs text-muted-foreground">tour</p>
                  <p class="font-medium">{{ tour.title }}</p>
                </div>
              </div>
              
              <div v-if="timeSlot.guides" class="flex items-start gap-3">
                <UserIcon class="mt-0.5 size-5 text-primary" />
                <div>
                  <p class="small-caps text-xs text-muted-foreground">guide</p>
                  <p class="font-medium">{{ timeSlot.guides.name }}</p>
                </div>
              </div>
              
              <div class="flex items-start gap-3">
                <CalendarIcon class="mt-0.5 size-5 text-primary" />
                <div>
                  <p class="small-caps text-xs text-muted-foreground">date</p>
                  <p class="font-medium">{{ formatDate(timeSlot.start_utc) }}</p>
                </div>
              </div>
              
              <div class="flex items-start gap-3">
                <ClockIcon class="mt-0.5 size-5 text-primary" />
                <div>
                  <p class="small-caps text-xs text-muted-foreground">time</p>
                  <p class="font-medium">{{ formatTime(timeSlot.start_utc) }}</p>
                </div>
              </div>

              <div v-if="tour?.meeting_point" class="flex items-start gap-3 sm:col-span-2">
                <MapPinIcon class="mt-0.5 size-5 text-primary" />
                <div>
                  <p class="small-caps text-xs text-muted-foreground">meeting point</p>
                  <p class="font-medium">{{ tour.meeting_point }}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <!-- guest info form -->
          <form @submit.prevent="onSubmit" class="space-y-5">
            <h2 class="small-caps font-medium tracking-wider">your information</h2>

            <!-- name -->
            <FormField v-slot="{ componentField }" name="guest_name">
              <FormItem>
                <FormLabel class="small-caps text-xs font-medium tracking-wider">full name</FormLabel>
                <div class="relative">
                  <UserIcon class="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    v-bind="componentField"
                    class="h-12 rounded-xl border-border bg-muted/30 pl-11 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="as shown on your ID"
                    autocomplete="name"
                  />
                </div>
                <FormMessage />
              </FormItem>
            </FormField>

            <!-- email -->
            <FormField v-slot="{ componentField }" name="guest_email">
              <FormItem>
                <FormLabel class="small-caps text-xs font-medium tracking-wider">email</FormLabel>
                <div class="relative">
                  <MailIcon class="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    v-bind="componentField"
                    type="email"
                    class="h-12 rounded-xl border-border bg-muted/30 pl-11 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="for booking confirmation"
                    autocomplete="email"
                  />
                </div>
                <FormMessage />
              </FormItem>
            </FormField>

            <!-- phone -->
            <FormField v-slot="{ componentField }" name="guest_phone">
              <FormItem>
                <FormLabel class="small-caps text-xs font-medium tracking-wider">
                  phone
                  <span class="ml-1 text-muted-foreground">(optional)</span>
                </FormLabel>
                <div class="relative">
                  <PhoneIcon class="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    v-bind="componentField"
                    type="tel"
                    class="h-12 rounded-xl border-border bg-muted/30 pl-11 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="+36 ..."
                    autocomplete="tel"
                  />
                </div>
                <FormMessage />
              </FormItem>
            </FormField>

            <!-- party size -->
            <FormField v-slot="{ componentField }" name="party_size">
              <FormItem>
                <FormLabel class="small-caps text-xs font-medium tracking-wider">number of people</FormLabel>
                <div class="relative">
                  <UsersIcon class="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <select
                    v-bind="componentField"
                    class="h-12 w-full rounded-xl border border-border bg-muted/30 pl-11 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    <option v-for="n in Math.min(timeSlot.capacity, 10)" :key="n" :value="n">
                      {{ n }} {{ n === 1 ? 'person' : 'people' }}
                    </option>
                  </select>
                </div>
                <FormDescription class="text-xs">{{ timeSlot.capacity }} spots available</FormDescription>
                <FormMessage />
              </FormItem>
            </FormField>

            <!-- price summary -->
            <div class="rounded-xl border border-border bg-card p-4">
              <div class="flex items-center justify-between">
                <span class="text-muted-foreground">
                  {{ isFreeOrTipBased ? 'price' : `${values.party_size} × €${pricePerPerson}` }}
                </span>
                <span class="text-xl font-bold" :class="isFreeOrTipBased ? 'text-accent' : ''">
                  {{ isFreeOrTipBased ? 'free' : `€${totalPrice}` }}
                </span>
              </div>
              <p v-if="isFreeOrTipBased" class="mt-2 text-xs text-muted-foreground">
                this is a free tour - tip your guide at the end
              </p>
            </div>

            <!-- submit -->
            <Button
              class="h-12 w-full rounded-xl btn-bounce text-sm font-medium"
              type="submit"
              :disabled="isSubmitting"
            >
              <span v-if="isSubmitting">confirming booking...</span>
              <span v-else class="flex items-center gap-2">
                confirm booking
                <ArrowRightIcon class="size-4" />
              </span>
            </Button>

            <!-- note -->
            <p class="text-center text-xs text-muted-foreground">
              you'll receive a confirmation email with your booking details
            </p>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
