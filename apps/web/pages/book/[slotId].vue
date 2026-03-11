<script setup lang="ts">
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CalendarIcon,
  ClockIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  TicketIcon,
  UserIcon,
  UsersIcon,
} from "lucide-vue-next";
import { z } from "zod";
import { toast } from "@/modules/ui/components/toast";

definePageMeta({ layout: "marketing" });
useSeoMeta({ title: "book your tour" });

const route = useRoute();
const supabase = useSupabase();
const { user } = useAuth();
const bookingManageToken = useBookingManageToken();

const loading = ref(true);
const slotDetails = ref<Record<string, any> | null>(null);

const formSchema = toTypedSchema(
  z.object({
    guest_name: z.string().min(2, "name must be at least 2 characters"),
    guest_email: z.string().email("enter a valid email"),
    guest_phone: z.string().optional(),
    party_size: z.number().min(1, "at least 1 person required"),
  }),
);

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    guest_name: user.value?.name || "",
    guest_email: user.value?.email || "",
    guest_phone: "",
    party_size: 1,
  },
});

const { handleSubmit, isSubmitting, setFieldError, values } = form;

const isFreeOrTipBased = computed(() => {
  return slotDetails.value?.tour_category === "free" || (slotDetails.value?.tips_enabled && !slotDetails.value?.base_price_cents);
});

const pricePerPerson = computed(() => {
  if (isFreeOrTipBased.value) 
return 0;
  return slotDetails.value?.base_price_cents ? slotDetails.value.base_price_cents / 100 : 35;
});

const totalPrice = computed(() => pricePerPerson.value * values.party_size);

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function formatTime(dateString: string) {
  return new Date(dateString).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function fetchSlotDetails() {
  loading.value = true;

  if (!supabase) {
    loading.value = false;
    return;
  }

  const slotId = Array.isArray(route.params.slotId) ? route.params.slotId[0] : route.params.slotId;

  try {
    const { data, error } = await supabase.rpc("get_public_slot_details", { p_slot_id: slotId });
    if (error) 
throw error;

    const detail = Array.isArray(data) ? data[0] : data;
    if (!detail || detail.remaining_capacity < 1) {
      slotDetails.value = null;
      return;
    }

    slotDetails.value = detail;
  } catch (error) {
    console.error("error fetching slot", error);
    slotDetails.value = null;
  } finally {
    loading.value = false;
  }
}

const onSubmit = handleSubmit(async (formValues) => {
  if (!supabase || !slotDetails.value) {
    toast({ title: "slot not available", variant: "error" });
    return;
  }

  if (formValues.party_size > slotDetails.value.remaining_capacity) {
    setFieldError("party_size", `only ${slotDetails.value.remaining_capacity} spots available`);
    return;
  }

  try {
    const { data, error } = await supabase.rpc("create_booking", {
      p_slot_id: slotDetails.value.slot_id,
      p_guest_name: formValues.guest_name,
      p_guest_email: formValues.guest_email,
      p_guest_phone: formValues.guest_phone || null,
      p_party_size: formValues.party_size,
    });

    if (error) 
throw error;

    const booking = Array.isArray(data) ? data[0] : data;
    if (!booking?.booking_id || !booking?.manage_token) {
      throw new Error("booking response was incomplete");
    }

    toast({ title: "booking confirmed!", variant: "success" });
    bookingManageToken.write(booking.booking_id, booking.manage_token);
    await navigateTo(`/book/confirmation/${booking.booking_id}`);
  } catch (error: any) {
    setFieldError("guest_name", error.message || "booking failed");
    toast({ title: "booking failed", description: error.message, variant: "error" });
  }
});

onMounted(fetchSlotDetails);
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-primary/5 to-background">
    <div class="container py-12">
      <div class="mx-auto max-w-2xl">
        <button class="smooth mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground" @click="navigateTo('/tours')">
          <ArrowLeftIcon class="size-4" />
          back to tours
        </button>

        <div v-if="loading" class="py-20 text-center">
          <div class="mx-auto size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p class="mt-4 text-muted-foreground">loading booking details...</p>
        </div>

        <div v-else-if="!slotDetails" class="py-20 text-center">
          <div class="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-muted">
            <CalendarIcon class="size-10 text-muted-foreground" />
          </div>
          <h1 class="font-display text-2xl font-bold">slot not available</h1>
          <p class="mt-2 text-muted-foreground">this time slot may have been filled or is no longer available</p>
          <Button class="mt-6 rounded-full" variant="outline" @click="navigateTo('/tours')">browse tours</Button>
        </div>

        <div v-else class="animate-in fade-in slide-in-from-bottom-4">
          <div class="mb-8">
            <div class="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <TicketIcon class="size-3.5" /> booking
            </div>
            <h1 class="font-display text-3xl font-bold">complete your booking</h1>
            <p class="mt-2 text-muted-foreground">you're almost there!</p>
          </div>

          <Card class="mb-8 overflow-hidden border-primary/20">
            <div class="bg-primary/5 p-4">
              <h3 class="small-caps text-xs font-medium tracking-wider text-muted-foreground">booking details</h3>
            </div>
            <CardContent class="grid gap-4 p-6 sm:grid-cols-2">
              <div class="flex items-start gap-3">
                <TicketIcon class="mt-0.5 size-5 text-primary" />
                <div>
                  <p class="small-caps text-xs text-muted-foreground">tour</p>
                  <p class="font-medium">{{ slotDetails.tour_title }}</p>
                </div>
              </div>

              <div class="flex items-start gap-3">
                <UserIcon class="mt-0.5 size-5 text-primary" />
                <div>
                  <p class="small-caps text-xs text-muted-foreground">guide</p>
                  <p class="font-medium">{{ slotDetails.guide_name }}</p>
                </div>
              </div>

              <div class="flex items-start gap-3">
                <CalendarIcon class="mt-0.5 size-5 text-primary" />
                <div>
                  <p class="small-caps text-xs text-muted-foreground">date</p>
                  <p class="font-medium">{{ formatDate(slotDetails.start_utc) }}</p>
                </div>
              </div>

              <div class="flex items-start gap-3">
                <ClockIcon class="mt-0.5 size-5 text-primary" />
                <div>
                  <p class="small-caps text-xs text-muted-foreground">time</p>
                  <p class="font-medium">{{ formatTime(slotDetails.start_utc) }}</p>
                </div>
              </div>

              <div v-if="slotDetails.meeting_point" class="flex items-start gap-3 sm:col-span-2">
                <MapPinIcon class="mt-0.5 size-5 text-primary" />
                <div>
                  <p class="small-caps text-xs text-muted-foreground">meeting point</p>
                  <p class="font-medium">{{ slotDetails.meeting_point }}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <form class="space-y-5" @submit.prevent="onSubmit">
            <h2 class="small-caps font-medium tracking-wider">your information</h2>

            <FormField v-slot="{ componentField }" name="guest_name">
              <FormItem>
                <FormLabel class="small-caps text-xs font-medium tracking-wider">full name</FormLabel>
                <div class="relative">
                  <UserIcon class="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input v-bind="componentField" class="h-12 rounded-xl border-border bg-muted/30 pl-11 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="as shown on your ID" autocomplete="name" />
                </div>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ componentField }" name="guest_email">
              <FormItem>
                <FormLabel class="small-caps text-xs font-medium tracking-wider">email</FormLabel>
                <div class="relative">
                  <MailIcon class="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input v-bind="componentField" type="email" class="h-12 rounded-xl border-border bg-muted/30 pl-11 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="for booking confirmation" autocomplete="email" />
                </div>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ componentField }" name="guest_phone">
              <FormItem>
                <FormLabel class="small-caps text-xs font-medium tracking-wider">phone <span class="ml-1 text-muted-foreground">(optional)</span></FormLabel>
                <div class="relative">
                  <PhoneIcon class="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input v-bind="componentField" type="tel" class="h-12 rounded-xl border-border bg-muted/30 pl-11 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="+36 ..." autocomplete="tel" />
                </div>
                <FormMessage />
              </FormItem>
            </FormField>

            <FormField v-slot="{ componentField }" name="party_size">
              <FormItem>
                <FormLabel class="small-caps text-xs font-medium tracking-wider">number of people</FormLabel>
                <div class="relative">
                  <UsersIcon class="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <select v-bind="componentField" class="h-12 w-full rounded-xl border border-border bg-muted/30 pl-11 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
                    <option v-for="n in Math.min(slotDetails.remaining_capacity, 10)" :key="n" :value="n">{{ n }} {{ n === 1 ? 'person' : 'people' }}</option>
                  </select>
                </div>
                <FormDescription class="text-xs">{{ slotDetails.remaining_capacity }} spots available</FormDescription>
                <FormMessage />
              </FormItem>
            </FormField>

            <div class="rounded-xl border border-border bg-card p-4">
              <div class="flex items-center justify-between">
                <span class="text-muted-foreground">{{ isFreeOrTipBased ? 'price' : `${values.party_size} × EUR ${pricePerPerson}` }}</span>
                <span class="text-xl font-bold" :class="isFreeOrTipBased ? 'text-accent' : ''">{{ isFreeOrTipBased ? 'free' : `EUR ${totalPrice}` }}</span>
              </div>
              <p v-if="isFreeOrTipBased" class="mt-2 text-xs text-muted-foreground">this is a free tour, tip your guide at the end</p>
            </div>

            <Button class="btn-bounce h-12 w-full rounded-xl text-sm font-medium" type="submit" :disabled="isSubmitting">
              <span v-if="isSubmitting">confirming booking...</span>
              <span v-else class="flex items-center gap-2">confirm booking <ArrowRightIcon class="size-4" /></span>
            </Button>

            <p class="text-center text-xs text-muted-foreground">you'll receive a private booking link after confirmation</p>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
