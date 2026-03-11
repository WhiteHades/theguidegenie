<script setup lang="ts">
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BadgeEuroIcon,
  CalendarIcon,
  CheckIcon,
  EuroIcon,
  FootprintsIcon,
  ImageIcon,
  LandmarkIcon,
  MapPinIcon,
  PlusIcon,
  ShipIcon,
  TrashIcon,
  UsersIcon,
} from "lucide-vue-next";
import { today, getLocalTimeZone } from "@internationalized/date";
import { toast } from "@/modules/ui/components/toast";
import { Calendar } from "@/modules/ui/components/calendar";
import { ScrollArea } from "@/modules/ui/components/scroll-area";
import { Stepper, StepperIndicator, StepperItem, StepperSeparator, StepperTitle, StepperTrigger } from "@/modules/ui/components/stepper";
import { Switch } from "@/modules/ui/components/switch";

definePageMeta({
  layout: "saas-app",
  middleware: ["guide-auth"],
});

useSeoMeta({ title: "create tour" });

await callOnce(() => useAuth().fetchUser());

const supabase = useSupabase();
const { user } = useAuth();
const { searchPhotos, buildImageUrl } = useUnsplash();

if (!supabase) {
  throw createError({
    statusCode: 500,
    statusMessage: "supabase client unavailable",
  });
}

const steps = [
  { id: "basics", title: "basics", icon: FootprintsIcon },
  { id: "details", title: "details", icon: MapPinIcon },
  { id: "pricing", title: "pricing", icon: EuroIcon },
  { id: "schedule", title: "schedule", icon: CalendarIcon },
  { id: "visuals", title: "visuals", icon: ImageIcon },
];

const categories = [
  { id: "paid", label: "paid tour", icon: BadgeEuroIcon, desc: "standard paid walking tour" },
  { id: "free", label: "free tour", icon: FootprintsIcon, desc: "tip-based free walking tour" },
  { id: "boat", label: "boat tour", icon: ShipIcon, desc: "scenic river cruises" },
  { id: "museum", label: "museum", icon: LandmarkIcon, desc: "guided museum visits" },
] as const;

const timeOptions = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"];

const currentStep = ref(1);
const loading = ref(false);
const unsplashQuery = ref("");
const unsplashPhotos = ref<any[]>([]);
const selectedDate = ref<any>();
const slotTime = ref("10:00");
const slotCapacity = ref(12);

const form = reactive({
  title: "",
  category: "paid" as (typeof categories)[number]["id"],
  provider_name: user.value?.name || "",
  description: "",
  meeting_point: "",
  duration_hours: 3,
  base_price: 35,
  tips_enabled: false,
  is_public: true,
  cover_image: "",
});

const scheduledSlots = ref<{ id: string; start_utc: Date; end_utc: Date; capacity: number }[]>([]);

const minDate = computed(() => today(getLocalTimeZone()));
const canProceed = computed(() => {
  switch (currentStep.value) {
    case 1:
      return form.title.trim().length > 5 && form.provider_name.trim().length > 0;
    case 2:
      return form.description.trim().length > 20 && form.meeting_point.trim().length > 5;
    case 3:
      return form.category === "free" || form.base_price > 0;
    case 4:
      return scheduledSlots.value.length > 0;
    default:
      return true;
  }
});

function formatSlotDate(value: Date) {
  return value.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function formatSlotTime(value: Date) {
  return value.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function addSlot() {
  if (!selectedDate.value) {
    toast({ title: "please select a date first", variant: "error" });
    return;
  }

  const dateValue = `${selectedDate.value.year}-${String(selectedDate.value.month).padStart(2, "0")}-${String(selectedDate.value.day).padStart(2, "0")}`;
  const startUtc = new Date(`${dateValue}T${slotTime.value}:00`);
  const endUtc = new Date(startUtc.getTime() + form.duration_hours * 60 * 60 * 1000);

  if (startUtc <= new Date()) {
    toast({ title: "slots must be in the future", variant: "error" });
    return;
  }

  if (scheduledSlots.value.some((slot) => slot.start_utc.getTime() === startUtc.getTime())) {
    toast({ title: "this time slot already exists", variant: "error" });
    return;
  }

  scheduledSlots.value.push({
    id: crypto.randomUUID(),
    start_utc: startUtc,
    end_utc: endUtc,
    capacity: slotCapacity.value,
  });

  scheduledSlots.value.sort((left, right) => left.start_utc.getTime() - right.start_utc.getTime());
}

function removeSlot(id: string) {
  scheduledSlots.value = scheduledSlots.value.filter((slot) => slot.id !== id);
}

async function searchUnsplashPhotos() {
  if (!unsplashQuery.value.trim()) 
return;
  unsplashPhotos.value = (await searchPhotos({ query: unsplashQuery.value, orientation: "landscape", perPage: 8 })) || [];
}

function selectPhoto(photo: any) {
  form.cover_image = buildImageUrl(photo.urls.raw, { width: 1200, quality: 80 });
}

async function createTour() {
  if (!supabase) {
    toast({ title: "supabase client not available", variant: "error" });
    return;
  }

  loading.value = true;

  try {
    const { data, error } = await supabase.rpc("create_tour_with_slots", {
      p_title: form.title,
      p_description: form.description,
      p_category: form.category,
      p_provider_name: form.provider_name,
      p_base_price_cents: form.category === "free" ? null : Math.round(form.base_price * 100),
      p_tips_enabled: form.category === "free" ? true : form.tips_enabled,
      p_meeting_point: form.meeting_point,
      p_cover_image: form.cover_image || null,
      p_duration_minutes: Math.round(form.duration_hours * 60),
      p_is_public: form.is_public,
      p_slots: scheduledSlots.value.map((slot) => ({
        start_utc: slot.start_utc.toISOString(),
        end_utc: slot.end_utc.toISOString(),
        capacity: slot.capacity,
      })),
    });

    if (error) 
throw error;

    toast({ title: "tour created", description: form.is_public ? "your tour is live" : "your tour has been saved as a draft", variant: "success" });
    await navigateTo(`/tours/${data}`);
  } catch (error: any) {
    toast({ title: "failed to create tour", description: error.message, variant: "error" });
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="container mx-auto max-w-3xl py-12">
    <div class="mb-12">
      <NuxtLink to="/guides/dashboard" class="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeftIcon class="size-4" />
        back to dashboard
      </NuxtLink>
      <h1 class="font-display text-4xl font-bold">create a new tour</h1>
      <p class="mt-2 text-muted-foreground">share your passion with the world</p>
    </div>

    <Stepper v-model="currentStep" class="mb-12">
      <StepperItem v-for="(step, idx) in steps" :key="step.id" :step="idx + 1">
        <StepperTrigger>
          <StepperIndicator>
            <component :is="step.icon" class="size-5" />
          </StepperIndicator>
          <StepperTitle>{{ step.title }}</StepperTitle>
        </StepperTrigger>
        <StepperSeparator v-if="idx < steps.length - 1" />
      </StepperItem>
    </Stepper>

    <div class="rounded-2xl border border-border bg-card p-8 shadow-sm">
      <div v-if="currentStep === 1" class="space-y-8 animate-in fade-in slide-in-from-right-4">
        <div>
          <label class="mb-2 block text-sm font-medium">tour category</label>
          <div class="grid grid-cols-2 gap-4">
            <button
              v-for="category in categories"
              :key="category.id"
              class="relative flex flex-col items-start rounded-xl border p-4 text-left transition-all hover:border-primary/50"
              :class="form.category === category.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border'"
              @click="form.category = category.id"
            >
              <component :is="category.icon" class="mb-3 size-6" :class="form.category === category.id ? 'text-primary' : 'text-muted-foreground'" />
              <div class="font-semibold">{{ category.label }}</div>
              <div class="mt-1 text-xs text-muted-foreground">{{ category.desc }}</div>
            </button>
          </div>
        </div>

        <div>
          <label class="mb-2 block text-sm font-medium">tour title</label>
          <Input v-model="form.title" class="rounded-xl" placeholder="e.g. hidden gems of the jewish quarter" />
        </div>

        <div>
          <label class="mb-2 block text-sm font-medium">provider name</label>
          <Input v-model="form.provider_name" class="rounded-xl" placeholder="your name or company name" />
        </div>
      </div>

      <div v-else-if="currentStep === 2" class="space-y-8 animate-in fade-in slide-in-from-right-4">
        <div>
          <label class="mb-2 block text-sm font-medium">description</label>
          <Textarea v-model="form.description" rows="6" class="rounded-xl" placeholder="describe the experience, what guests will see, and why it's special..." />
        </div>

        <div>
          <label class="mb-2 block text-sm font-medium">meeting point</label>
          <div class="relative">
            <MapPinIcon class="absolute left-3 top-3 size-5 text-muted-foreground" />
            <Input v-model="form.meeting_point" class="rounded-xl pl-10" placeholder="exact address or landmark" />
          </div>
        </div>

        <div>
          <label class="mb-2 block text-sm font-medium">duration (hours)</label>
          <select v-model.number="form.duration_hours" class="w-full rounded-xl border border-border bg-background px-4 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary">
            <option v-for="hours in [1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6]" :key="hours" :value="hours">
              {{ hours }} {{ hours === 1 ? 'hour' : 'hours' }}
            </option>
          </select>
        </div>
      </div>

      <div v-else-if="currentStep === 3" class="space-y-8 animate-in fade-in slide-in-from-right-4">
        <div v-if="form.category !== 'free'">
          <label class="mb-2 block text-sm font-medium">ticket price (per person)</label>
          <div class="relative">
            <span class="absolute left-4 top-2.5 text-lg font-bold">EUR</span>
            <Input v-model.number="form.base_price" type="number" min="0" class="rounded-xl pl-16 text-lg font-bold" />
          </div>
        </div>

        <div v-else class="rounded-xl border border-accent/20 bg-accent/10 p-6 text-center text-accent-foreground">
          <FootprintsIcon class="mx-auto mb-3 size-8" />
          <h3 class="font-bold">free tour mode</h3>
          <p class="mt-2 text-sm">guests book for free and tip at the end. tipping stays enabled by default.</p>
        </div>

        <div v-if="form.category !== 'free'" class="flex items-center justify-between rounded-xl border border-border p-4">
          <div>
            <div class="font-medium">enable tips</div>
            <div class="text-xs text-muted-foreground">allow guests to leave extra tips after the tour</div>
          </div>
          <Switch v-model:checked="form.tips_enabled" />
        </div>
      </div>

      <div v-else-if="currentStep === 4" class="space-y-6 animate-in fade-in slide-in-from-right-4">
        <div class="grid gap-6 md:grid-cols-2">
          <div>
            <label class="mb-2 block text-sm font-medium">select dates</label>
            <div class="rounded-xl border border-border bg-background p-2">
              <Calendar v-model="selectedDate" :min-value="minDate" />
            </div>
          </div>

          <div class="space-y-4">
            <div>
              <label class="mb-2 block text-sm font-medium">start time</label>
              <select v-model="slotTime" class="w-full rounded-xl border border-border bg-background px-4 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary">
                <option v-for="time in timeOptions" :key="time" :value="time">{{ time }}</option>
              </select>
            </div>

            <div>
              <label class="mb-2 block text-sm font-medium">max capacity</label>
              <div class="relative">
                <UsersIcon class="absolute left-3 top-2.5 size-5 text-muted-foreground" />
                <Input v-model.number="slotCapacity" type="number" min="1" max="50" class="rounded-xl pl-10" />
              </div>
            </div>

            <Button class="w-full" :disabled="!selectedDate" @click="addSlot">
              <PlusIcon class="mr-2 size-4" />
              add time slot
            </Button>
          </div>
        </div>

        <div v-if="scheduledSlots.length" >
          <label class="mb-2 block text-sm font-medium">scheduled slots ({{ scheduledSlots.length }})</label>
          <ScrollArea class="h-60 rounded-xl border border-border">
            <div class="space-y-2 p-2">
              <div v-for="slot in scheduledSlots" :key="slot.id" class="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
                <div class="flex items-center gap-3">
                  <div class="flex flex-col items-center rounded-lg bg-primary/10 px-2 py-1 text-xs text-primary">
                    <span class="font-bold">{{ formatSlotDate(slot.start_utc) }}</span>
                  </div>
                  <div>
                    <div class="text-sm font-medium">{{ formatSlotTime(slot.start_utc) }}</div>
                    <div class="text-xs text-muted-foreground">{{ slot.capacity }} spots</div>
                  </div>
                </div>
                <button class="smooth text-muted-foreground hover:text-destructive" @click="removeSlot(slot.id)">
                  <TrashIcon class="size-4" />
                </button>
              </div>
            </div>
          </ScrollArea>
        </div>

        <div v-else class="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
          <CalendarIcon class="mx-auto mb-2 size-8 opacity-50" />
          <p class="text-sm">no slots scheduled yet</p>
          <p class="mt-1 text-xs">select a date and add time slots</p>
        </div>
      </div>

      <div v-else class="space-y-8 animate-in fade-in slide-in-from-right-4">
        <div>
          <label class="mb-4 block text-sm font-medium">cover photo</label>

          <div class="mb-6 flex gap-2">
            <Input v-model="unsplashQuery" class="flex-1 rounded-xl" placeholder="search unsplash photos (e.g. budapest night)" @keyup.enter="searchUnsplashPhotos" />
            <Button variant="secondary" class="rounded-xl" @click="searchUnsplashPhotos">search</Button>
          </div>

          <div v-if="unsplashPhotos.length" class="grid grid-cols-4 gap-4">
            <button
              v-for="photo in unsplashPhotos"
              :key="photo.id"
              class="group relative aspect-square overflow-hidden rounded-lg border-2 transition-all hover:scale-105"
              :class="form.cover_image.includes(photo.id) ? 'border-primary ring-2 ring-primary ring-offset-2' : 'border-transparent'"
              @click="selectPhoto(photo)"
            >
              <img :src="photo.urls.small" class="size-full object-cover" :alt="photo.alt_description || 'tour cover option'" />
            </button>
          </div>

          <div v-if="form.cover_image" class="mt-6">
            <p class="mb-2 text-sm font-medium">preview</p>
            <div class="relative aspect-[2/1] w-full overflow-hidden rounded-xl border border-border">
              <img :src="form.cover_image" class="size-full object-cover" alt="tour cover preview" />
            </div>
          </div>
        </div>
      </div>

      <div class="mt-12 flex justify-between border-t border-border pt-6">
        <Button v-if="currentStep > 1" variant="ghost" @click="currentStep--">back</Button>
        <div v-else />

        <Button v-if="currentStep < steps.length" class="btn-bounce" :disabled="!canProceed" @click="currentStep++">
          continue
          <ArrowRightIcon class="ml-2 size-4" />
        </Button>

        <Button v-else class="btn-bounce bg-primary text-primary-foreground" :loading="loading" :disabled="!canProceed" @click="createTour">
          publish tour
          <CheckIcon class="ml-2 size-4" />
        </Button>
      </div>
    </div>
  </div>
</template>
