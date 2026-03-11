<script setup lang="ts">
import {
  CalendarIcon,
  CheckCircleIcon,
  CopyIcon,
  ExternalLinkIcon,
  MailIcon,
  UserIcon,
  XCircleIcon,
} from "lucide-vue-next";
import { toast } from "@/modules/ui/components/toast";

definePageMeta({ layout: "marketing" });
useSeoMeta({ title: "manage booking" });

const route = useRoute();
const supabase = useSupabase();
const loading = ref(true);
const booking = ref<Record<string, any> | null>(null);
const validToken = ref(false);
const cancelling = ref(false);
const bookingId = computed(() => {
  const value = route.params.id;
  return Array.isArray(value) ? value[0] : value;
});
const manageLink = ref<string | null>(null);

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(dateString: string) {
  return new Date(dateString).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const hasPrivateLink = computed(() => !!manageLink.value);

const maskedManageLink = computed(() => {
  if (!booking.value || !manageLink.value) {
    return "";
  }

  return `/book/confirmation/${booking.value.booking_id}?token=hidden`;
});

async function fetchBooking() {
  loading.value = true;

  if (!supabase) {
    loading.value = false;
    return;
  }

  try {
    const result = await $fetch<{ booking: Record<string, any> | null; manageLink: string | null }>(`/api/bookings/${bookingId.value}`);
    booking.value = result.booking;
    manageLink.value = result.manageLink;
    validToken.value = !!result.booking;
  } catch (error) {
    console.error("error fetching booking", error);
    booking.value = null;
    manageLink.value = null;
    validToken.value = false;
  } finally {
    loading.value = false;
  }
}

async function copyLink() {
  if (!manageLink.value) {
    toast({ title: "private link unavailable", variant: "error" });
    return;
  }

  try {
    await navigator.clipboard.writeText(manageLink.value);
    toast({ title: "link copied", variant: "success" });
  } catch {
    toast({ title: "failed to copy link", variant: "error" });
  }
}

async function cancelBooking() {
  if (!supabase || !booking.value) 
return;

  cancelling.value = true;

  try {
    const { data, error } = await supabase.rpc("cancel_booking", {
      p_booking_id: booking.value.booking_id,
    });

    if (error) 
throw error;

    await $fetch(`/api/bookings/${booking.value.booking_id}/session`, {
      method: "DELETE",
    });

    booking.value = data;
    await fetchBooking();
    toast({ title: "booking cancelled", variant: "success" });
  } catch (error: any) {
    toast({ title: "unable to cancel booking", description: error.message, variant: "error" });
  } finally {
    cancelling.value = false;
  }
}

onMounted(async () => {
  const queryToken = typeof route.query.token === "string" ? route.query.token : null;

  if (queryToken) {
    await $fetch(`/api/bookings/${bookingId.value}/session`, {
      method: "POST",
      body: {
        token: queryToken,
      },
    });

    await navigateTo(`/book/confirmation/${bookingId.value}`, { replace: true });
    return;
  }

  fetchBooking();
});
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-primary/5 to-background">
    <div class="container py-12">
      <div class="mx-auto max-w-2xl">
        <div v-if="loading" class="py-20 text-center">
          <div class="mx-auto size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p class="mt-4 text-muted-foreground">loading booking...</p>
        </div>

        <div v-else-if="!validToken || !booking" class="py-20 text-center">
          <div class="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-muted">
            <CalendarIcon class="size-10 text-muted-foreground" />
          </div>
          <h1 class="font-display text-2xl font-bold">booking not found</h1>
          <p class="mt-2 text-muted-foreground">please check your private booking link and try again</p>
          <Button class="mt-6 rounded-full" variant="outline" @click="navigateTo('/tours')">browse tours</Button>
        </div>

        <div v-else class="animate-in fade-in slide-in-from-bottom-4">
          <div class="mb-8 text-center">
            <div class="mx-auto mb-6 flex size-24 items-center justify-center rounded-full bg-primary/10">
              <CheckCircleIcon class="size-12 text-primary" />
            </div>
            <div class="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <CheckCircleIcon class="size-3.5" />
              {{ booking.status === 'confirmed' ? 'confirmed' : 'updated' }}
            </div>
            <h1 class="font-display text-3xl font-bold">manage your booking</h1>
            <p class="mt-2 text-muted-foreground">keep this page handy if you need to review or cancel your reservation</p>
          </div>

          <Card class="mb-6 overflow-hidden border-primary/20">
            <div class="bg-primary/5 p-4">
              <h3 class="small-caps text-xs font-medium tracking-wider text-muted-foreground">booking details</h3>
            </div>
            <CardContent class="space-y-4 p-6">
              <div class="flex items-start gap-3">
                <CalendarIcon class="mt-0.5 size-5 text-primary" />
                <div>
                  <p class="small-caps text-xs text-muted-foreground">date & time</p>
                  <p class="font-medium">{{ formatDate(booking.slot_start_utc) }}</p>
                  <p class="text-sm text-muted-foreground">{{ formatTime(booking.slot_start_utc) }}</p>
                </div>
              </div>

              <div class="flex items-start gap-3">
                <UserIcon class="mt-0.5 size-5 text-primary" />
                <div>
                  <p class="small-caps text-xs text-muted-foreground">your guide</p>
                  <p class="font-medium">{{ booking.guide_name }}</p>
                  <a :href="`mailto:${booking.guide_contact_email}`" class="text-sm text-primary hover:underline">{{ booking.guide_contact_email }}</a>
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
                    <span class="rounded-full bg-muted px-2 py-0.5 text-xs">{{ booking.party_size }} {{ booking.party_size === 1 ? 'person' : 'people' }}</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card class="mb-6">
            <CardHeader>
              <CardTitle class="small-caps text-sm font-medium tracking-wider">what's next</CardTitle>
            </CardHeader>
            <CardContent class="space-y-3 text-sm text-muted-foreground">
              <div>tour: <span class="font-medium text-foreground">{{ booking.tour_title }}</span></div>
              <div>meeting point: <span class="font-medium text-foreground">{{ booking.meeting_point || 'shared by your guide after booking' }}</span></div>
              <div>status: <span class="font-medium text-foreground">{{ booking.status }}</span></div>
            </CardContent>
          </Card>

          <Card v-if="hasPrivateLink" class="mb-6 border-accent/20 bg-accent/5">
            <CardContent class="p-4">
              <div class="flex items-start gap-3">
                <ExternalLinkIcon class="mt-0.5 size-5 text-accent" />
                <div class="flex-1">
                  <p class="font-medium text-accent-foreground">save this private link</p>
                  <p class="mt-1 text-xs text-muted-foreground">copy it somewhere safe if you want to reopen this booking without signing in</p>
                  <div class="mt-3 flex items-center gap-2">
                    <code class="flex-1 truncate rounded-lg bg-background/50 px-3 py-2 text-xs">{{ maskedManageLink }}</code>
                    <Button class="shrink-0" size="sm" variant="outline" @click="copyLink">
                      <CopyIcon class="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div class="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button variant="outline" class="rounded-full" @click="navigateTo('/tours')">browse more tours</Button>
            <Button
              v-if="booking.status === 'confirmed'"
              class="rounded-full"
              variant="destructive"
              :disabled="cancelling"
              @click="cancelBooking"
            >
              <XCircleIcon class="mr-2 size-4" />
              {{ cancelling ? 'cancelling...' : 'cancel booking' }}
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
