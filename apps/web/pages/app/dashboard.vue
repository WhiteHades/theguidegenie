<script setup lang="ts">
import { CalendarIcon, ClockIcon, MapPinIcon, TicketIcon, UserIcon, XCircleIcon } from "lucide-vue-next";
import { toast } from "@/modules/ui/components/toast";

definePageMeta({
  layout: "saas-app",
  middleware: ["tourist-auth"],
});

useSeoMeta({ title: "my bookings" });

await callOnce(() => useAuth().fetchUser());

const supabase = useSupabase();
const bookings = ref<any[]>([]);
const loading = ref(true);
const cancellingId = ref<string | null>(null);

if (!supabase) {
  throw createError({
    statusCode: 500,
    statusMessage: "supabase client unavailable",
  });
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function fetchBookings() {
  loading.value = true;

  if (!supabase) {
    loading.value = false;
    return;
  }

  try {
    const { data, error } = await supabase.rpc("get_account_bookings");
    if (error) throw error;
    bookings.value = data || [];
  } catch (error) {
    console.error("failed to load bookings", error);
    bookings.value = [];
  } finally {
    loading.value = false;
  }
}

async function cancelBooking(bookingId: string) {
  if (!supabase) return;
  cancellingId.value = bookingId;

  try {
    const { error } = await supabase.rpc("cancel_booking", {
      p_booking_id: bookingId,
    });

    if (error) throw error;

    await fetchBookings();
    toast({ title: "booking cancelled", variant: "success" });
  } catch (error: any) {
    toast({ title: "unable to cancel booking", description: error.message, variant: "error" });
  } finally {
    cancellingId.value = null;
  }
}

await fetchBookings();
</script>

<template>
  <div class="container py-8">
    <div class="mb-8 flex items-center justify-between gap-4">
      <div>
        <h1 class="font-display text-3xl font-bold">my bookings</h1>
        <p class="mt-2 text-muted-foreground">manage your upcoming and past tours</p>
      </div>

      <Button @click="navigateTo('/tours')">browse tours</Button>
    </div>

    <div v-if="loading" class="py-20 text-center text-muted-foreground">
      loading bookings...
    </div>

    <div v-else-if="!bookings.length" class="rounded-2xl border border-dashed p-12 text-center text-muted-foreground">
      <TicketIcon class="mx-auto mb-3 size-10 opacity-50" />
      no bookings yet
    </div>

    <div v-else class="space-y-4">
      <Card v-for="booking in bookings" :key="booking.booking_id">
        <CardContent class="space-y-4 p-6">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 class="text-lg font-semibold">{{ booking.tour_title }}</h2>
              <div class="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span class="flex items-center gap-1"><CalendarIcon class="size-4" /> {{ formatDate(booking.slot_start_utc) }}</span>
                <span class="flex items-center gap-1"><ClockIcon class="size-4" /> {{ formatTime(booking.slot_start_utc) }}</span>
                <span class="flex items-center gap-1"><UserIcon class="size-4" /> {{ booking.guide_name }}</span>
                <span class="flex items-center gap-1"><MapPinIcon class="size-4" /> {{ booking.meeting_point || 'meeting point shared after booking' }}</span>
              </div>
            </div>

            <Badge :variant="booking.status === 'confirmed' ? 'default' : 'secondary'">{{ booking.status }}</Badge>
          </div>

          <div class="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span>{{ booking.party_size }} {{ booking.party_size === 1 ? 'person' : 'people' }}</span>
            <span>·</span>
            <span>{{ booking.guest_email }}</span>
          </div>

          <div class="flex flex-wrap gap-3">
            <Button variant="outline" @click="navigateTo(`/book/confirmation/${booking.booking_id}`)">
              view details
            </Button>
            <Button
              v-if="booking.status === 'confirmed'"
              variant="destructive"
              :disabled="cancellingId === booking.booking_id"
              @click="cancelBooking(booking.booking_id)"
            >
              <XCircleIcon class="mr-2 size-4" />
              {{ cancellingId === booking.booking_id ? 'cancelling...' : 'cancel booking' }}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
