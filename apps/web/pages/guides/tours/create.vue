<script setup lang="ts">
// @ts-nocheck
import { 
  ArrowRightIcon, 
  ArrowLeftIcon, 
  MapPinIcon, 
  EuroIcon, 
  ImageIcon, 
  CheckIcon, 
  ShipIcon, 
  LandmarkIcon, 
  FootprintsIcon, 
  BadgeEuroIcon,
  CalendarIcon,
  ClockIcon,
  UsersIcon,
  TrashIcon,
  PlusIcon,
} from 'lucide-vue-next'
import { toast } from '@/modules/ui/components/toast'
import { Calendar } from '@/modules/ui/components/calendar'
import { Switch } from '@/modules/ui/components/switch'
import { ScrollArea } from '@/modules/ui/components/scroll-area'
import { Stepper, StepperItem, StepperTrigger, StepperIndicator, StepperTitle, StepperSeparator } from '@/modules/ui/components/stepper'
import { Input } from '@/modules/ui/components/input'
import { Textarea } from '@/modules/ui/components/textarea'
import { getLocalTimeZone, today } from '@internationalized/date'

definePageMeta({ 
  layout: 'saas-app',
  middleware: ['guide-auth']
})

useSeoMeta({ title: 'create tour' })

const { user } = useAuth()
const supabase = useSupabase()
const { searchPhotos, buildImageUrl } = useUnsplash()

const steps = [
  { id: 'basics', title: 'basics', icon: FootprintsIcon },
  { id: 'details', title: 'details', icon: MapPinIcon },
  { id: 'pricing', title: 'pricing', icon: EuroIcon },
  { id: 'schedule', title: 'schedule', icon: CalendarIcon },
  { id: 'visuals', title: 'visuals', icon: ImageIcon },
]

const currentStep = ref(1)
const loading = ref(false)
const unsplashQuery = ref('')
const unsplashPhotos = ref([])

const form = reactive({
  title: '',
  category: 'paid',
  provider_name: user.value?.name || '',
  description: '',
  meeting_point: '',
  duration_hours: 3,
  base_price: 35,
  tips_enabled: false,
  is_public: true,
  cover_image: '',
})

const scheduledSlots = ref([])
const selectedDate = ref()
const slotTime = ref('10:00')
const slotCapacity = ref(12)

const categories = [
  { id: 'paid', label: 'paid tour', icon: BadgeEuroIcon, desc: 'standard paid walking tour' },
  { id: 'free', label: 'free tour', icon: FootprintsIcon, desc: 'tip-based free walking tour' },
  { id: 'boat', label: 'boat tour', icon: ShipIcon, desc: 'scenic river cruises' },
  { id: 'museum', label: 'museum', icon: LandmarkIcon, desc: 'guided museum visits' },
]

const timeOptions = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
]

const canProceed = computed(() => {
  switch (currentStep.value) {
    case 1: return form.title.length > 5 && form.provider_name.length > 0
    case 2: return form.description.length > 20 && form.meeting_point.length > 5
    case 3: return form.category === 'free' || form.base_price > 0
    case 4: return scheduledSlots.value.length > 0
    case 5: return true
    default: return false
  }
})

const minDate = computed(() => today(getLocalTimeZone()))

function addSlot() {
  if (!selectedDate.value) {
    toast({ title: 'please select a date first', variant: 'error' })
    return
  }
  
  const dateStr = `${selectedDate.value.year}-${String(selectedDate.value.month).padStart(2, '0')}-${String(selectedDate.value.day).padStart(2, '0')}`
  const startUtc = new Date(`${dateStr}T${slotTime.value}:00`)
  const endUtc = new Date(startUtc.getTime() + form.duration_hours * 60 * 60 * 1000)
  
  const exists = scheduledSlots.value.some(s => s.start_utc.getTime() === startUtc.getTime())
  
  if (exists) {
    toast({ title: 'this time slot already exists', variant: 'error' })
    return
  }
  
  scheduledSlots.value.push({
    id: crypto.randomUUID(),
    start_utc: startUtc,
    end_utc: endUtc,
    capacity: slotCapacity.value,
  })
  
  scheduledSlots.value.sort((a, b) => a.start_utc.getTime() - b.start_utc.getTime())
}

function removeSlot(id) {
  scheduledSlots.value = scheduledSlots.value.filter(s => s.id !== id)
}

function formatSlotDate(d) {
  return d.toLocaleDateString('en-us', { weekday: 'short', month: 'short', day: 'numeric' })
}

function formatSlotTime(d) {
  return d.toLocaleTimeString('en-us', { hour: '2-digit', minute: '2-digit' })
}

async function searchUnsplash() {
  if (!unsplashQuery.value) return
  const photos = await searchPhotos({ query: unsplashQuery.value, orientation: 'landscape', perPage: 8 })
  unsplashPhotos.value = photos || []
}

function selectPhoto(photo) {
  form.cover_image = buildImageUrl(photo.urls.raw, { width: 1200, quality: 80 })
}

async function createTour() {
  loading.value = true
  try {
    const { data: guide } = await supabase.from('guides').select('id').eq('user_id', user.value.id).single()
    
    if (!guide) throw new Error('guide profile not found')

    const { data: tourData, error: tourError } = await supabase.from('tours').insert({
      guide_id: guide.id,
      title: form.title,
      description: form.description,
      category: form.category,
      provider_name: form.provider_name,
      base_price_cents: form.category === 'free' ? null : Math.round(form.base_price * 100),
      tips_enabled: form.category === 'free' || form.tips_enabled,
      meeting_point: form.meeting_point,
      is_public: form.is_public
    }).select().single()

    if (tourError) throw tourError

    if (scheduledSlots.value.length > 0) {
      const slotsToInsert = scheduledSlots.value.map(slot => ({
        guide_id: guide.id,
        tour_id: tourData.id,
        start_utc: slot.start_utc.toISOString(),
        end_utc: slot.end_utc.toISOString(),
        capacity: slot.capacity,
        is_open: true,
      }))

      const { error: slotsError } = await supabase.from('time_slots').insert(slotsToInsert)
      if (slotsError) throw slotsError
    }

    toast({ title: 'tour created!', description: 'your tour is now live', variant: 'success' })
    navigateTo('/guides/dashboard')
  } catch (e) {
    toast({ title: 'failed to create tour', description: e.message, variant: 'error' })
  } finally {
    loading.value = false
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
              v-for="cat in categories"
              :key="cat.id"
              @click="form.category = cat.id"
              class="relative flex flex-col items-start rounded-xl border p-4 text-left transition-all hover:border-primary/50"
              :class="form.category === cat.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border'"
            >
              <component :is="cat.icon" class="mb-3 size-6" :class="form.category === cat.id ? 'text-primary' : 'text-muted-foreground'" />
              <div class="font-semibold">{{ cat.label }}</div>
              <div class="mt-1 text-xs text-muted-foreground">{{ cat.desc }}</div>
            </button>
          </div>
        </div>

        <div>
          <label class="mb-2 block text-sm font-medium">tour title</label>
          <Input v-model="form.title" placeholder="e.g. hidden gems of the jewish quarter" class="rounded-xl" />
        </div>

        <div>
          <label class="mb-2 block text-sm font-medium">provider name</label>
          <Input v-model="form.provider_name" placeholder="your name or company name" class="rounded-xl" />
        </div>
      </div>

      <div v-else-if="currentStep === 2" class="space-y-8 animate-in fade-in slide-in-from-right-4">
        <div>
          <label class="mb-2 block text-sm font-medium">description</label>
          <Textarea
            v-model="form.description"
            rows="6"
            placeholder="describe the experience, what guests will see, and why it's special..."
            class="rounded-xl"
          />
        </div>

        <div>
          <label class="mb-2 block text-sm font-medium">meeting point</label>
          <div class="relative">
            <MapPinIcon class="absolute left-3 top-3 size-5 text-muted-foreground" />
            <Input
              v-model="form.meeting_point"
              placeholder="exact address or landmark"
              class="rounded-xl pl-10"
            />
          </div>
        </div>

        <div>
          <label class="mb-2 block text-sm font-medium">duration (hours)</label>
          <select
            v-model.number="form.duration_hours"
            class="w-full rounded-xl border border-border bg-background px-4 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          >
            <option v-for="h in [1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6]" :key="h" :value="h">{{ h }} {{ h === 1 ? 'hour' : 'hours' }}</option>
          </select>
        </div>
      </div>

      <div v-else-if="currentStep === 3" class="space-y-8 animate-in fade-in slide-in-from-right-4">
        <div v-if="form.category !== 'free'">
          <label class="mb-2 block text-sm font-medium">ticket price (per person)</label>
          <div class="relative">
            <span class="absolute left-4 top-2.5 text-lg font-bold">€</span>
            <Input
              v-model.number="form.base_price"
              type="number"
              min="0"
              class="rounded-xl pl-10 text-lg font-bold"
            />
          </div>
        </div>

        <div v-else class="rounded-xl bg-accent/10 p-6 text-center text-accent-foreground border border-accent/20">
          <FootprintsIcon class="mx-auto mb-3 size-8" />
          <h3 class="font-bold">free tour mode</h3>
          <p class="mt-2 text-sm">guests book for free and tip at the end. tipping will be enabled by default.</p>
        </div>

        <div v-if="form.category !== 'free'" class="flex items-center justify-between rounded-xl border border-border p-4">
          <div>
            <div class="font-medium">enable tips</div>
            <div class="text-xs text-muted-foreground">allow guests to leave extra tips via the app</div>
          </div>
          <Switch v-model:checked="form.tips_enabled" />
        </div>
      </div>

      <div v-else-if="currentStep === 4" class="space-y-6 animate-in fade-in slide-in-from-right-4">
        <div class="grid gap-6 md:grid-cols-2">
          <div>
            <label class="mb-2 block text-sm font-medium">select dates</label>
            <div class="rounded-xl border border-border p-2 bg-background">
              <Calendar v-model="selectedDate" :min-value="minDate" />
            </div>
          </div>

          <div class="space-y-4">
            <div>
              <label class="mb-2 block text-sm font-medium">start time</label>
              <select
                v-model="slotTime"
                class="w-full rounded-xl border border-border bg-background px-4 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              >
                <option v-for="t in timeOptions" :key="t" :value="t">{{ t }}</option>
              </select>
            </div>

            <div>
              <label class="mb-2 block text-sm font-medium">max capacity</label>
              <div class="relative">
                <UsersIcon class="absolute left-3 top-2.5 size-5 text-muted-foreground" />
                <Input
                  v-model.number="slotCapacity"
                  type="number"
                  min="1"
                  max="50"
                  class="rounded-xl pl-10"
                />
              </div>
            </div>

            <Button @click="addSlot" class="w-full" :disabled="!selectedDate">
              <PlusIcon class="mr-2 size-4" />
              add time slot
            </Button>
          </div>
        </div>

        <div v-if="scheduledSlots.length > 0">
          <label class="mb-2 block text-sm font-medium">scheduled slots ({{ scheduledSlots.length }})</label>
          <ScrollArea class="h-60 rounded-xl border border-border">
            <div class="space-y-2 p-2">
              <div
                v-for="slot in scheduledSlots"
                :key="slot.id"
                class="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3"
              >
                <div class="flex items-center gap-3">
                  <div class="flex flex-col items-center rounded-lg bg-primary/10 px-2 py-1 text-primary text-xs">
                    <span class="font-bold">{{ formatSlotDate(slot.start_utc) }}</span>
                  </div>
                  <div>
                    <div class="font-medium text-sm">{{ formatSlotTime(slot.start_utc) }}</div>
                    <div class="text-xs text-muted-foreground">{{ slot.capacity }} spots</div>
                  </div>
                </div>
                <button @click="removeSlot(slot.id)" class="text-muted-foreground hover:text-destructive smooth">
                  <TrashIcon class="size-4" />
                </button>
              </div>
            </div>
          </ScrollArea>
        </div>

        <div v-else class="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
          <CalendarIcon class="mx-auto mb-2 size-8 opacity-50" />
          <p class="text-sm">no slots scheduled yet</p>
          <p class="text-xs mt-1">select a date and add time slots</p>
        </div>
      </div>

      <div v-else-if="currentStep === 5" class="space-y-8 animate-in fade-in slide-in-from-right-4">
        <div>
          <label class="mb-4 block text-sm font-medium">cover photo</label>
          
          <div class="mb-6 flex gap-2">
            <Input
              v-model="unsplashQuery"
              @keyup.enter="searchUnsplash"
              placeholder="search unsplash photos (e.g. budapest night)"
              class="flex-1 rounded-xl"
            />
            <Button @click="searchUnsplash" variant="secondary" class="rounded-xl">search</Button>
          </div>

          <div v-if="unsplashPhotos.length" class="grid grid-cols-4 gap-4">
            <button
              v-for="photo in unsplashPhotos"
              :key="photo.id"
              @click="selectPhoto(photo)"
              class="group relative aspect-square overflow-hidden rounded-lg border-2 transition-all hover:scale-105"
              :class="form.cover_image.includes(photo.id) ? 'border-primary ring-2 ring-primary ring-offset-2' : 'border-transparent'"
            >
              <img :src="photo.urls.small" class="h-full w-full object-cover" />
            </button>
          </div>

          <div v-if="form.cover_image" class="mt-6">
            <p class="mb-2 text-sm font-medium">preview</p>
            <div class="relative aspect-[2/1] w-full overflow-hidden rounded-xl border border-border">
              <img :src="form.cover_image" class="h-full w-full object-cover" />
            </div>
          </div>
        </div>
      </div>

      <div class="mt-12 flex justify-between border-t border-border pt-6">
        <Button
          v-if="currentStep > 1"
          variant="ghost"
          @click="currentStep--"
        >
          back
        </Button>
        <div v-else></div>

        <Button
          v-if="currentStep < steps.length"
          @click="currentStep++"
          :disabled="!canProceed"
          class="btn-bounce"
        >
          continue
          <ArrowRightIcon class="ml-2 size-4" />
        </Button>

        <Button
          v-else
          @click="createTour"
          :loading="loading"
          :disabled="!canProceed"
          class="btn-bounce bg-primary text-primary-foreground"
        >
          publish tour
          <CheckIcon class="ml-2 size-4" />
        </Button>
      </div>
    </div>
  </div>
</template>
