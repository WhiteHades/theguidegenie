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
  BadgeEuroIcon 
} from 'lucide-vue-next'
import { z } from 'zod'
import { toast } from '@/modules/ui/components/toast'

definePageMeta({ 
  layout: 'saas-app',
  middleware: ['guide-auth']
})

useSeoMeta({ title: 'create tour' })

const { user } = useAuth()
const supabase = useSupabase()
const { searchPhotos, buildImageUrl } = useUnsplash()

// steps configuration
const steps = [
  { id: 'basics', title: 'basics', icon: FootprintsIcon },
  { id: 'details', title: 'details', icon: MapPinIcon },
  { id: 'pricing', title: 'pricing', icon: EuroIcon },
  { id: 'visuals', title: 'visuals', icon: ImageIcon },
]

const currentStep = ref(0)
const loading = ref(false)
const unsplashQuery = ref('')
const unsplashPhotos = ref([])

// form state
const form = reactive({
  title: '',
  category: 'paid', // free, paid, boat, museum
  provider_name: user.value?.name || '',
  description: '',
  meeting_point: '',
  base_price: 35,
  tips_enabled: false,
  is_public: true,
  cover_image: '', // we'll need to handle image storage or link
})

// categories with icons
const categories = [
  { id: 'paid', label: 'paid tour', icon: BadgeEuroIcon, desc: 'standard paid walking tour' },
  { id: 'free', label: 'free tour', icon: FootprintsIcon, desc: 'tip-based free walking tour' },
  { id: 'boat', label: 'boat tour', icon: ShipIcon, desc: 'scenic river cruises' },
  { id: 'museum', label: 'museum', icon: LandmarkIcon, desc: 'guided museum visits' },
]

// validation logic (simplified)
const canProceed = computed(() => {
  switch (currentStep.value) {
    case 0: return form.title.length > 5 && form.provider_name.length > 0
    case 1: return form.description.length > 20 && form.meeting_point.length > 5
    case 2: return form.category === 'free' || form.base_price > 0
    case 3: return true // optional image for now, but recommended
    default: return false
  }
})

// actions
async function searchUnsplash() {
  if (!unsplashQuery.value) return
  const photos = await searchPhotos({ query: unsplashQuery.value, orientation: 'landscape', perPage: 8 })
  unsplashPhotos.value = photos || []
}

function selectPhoto(photo) {
  // in a real app, we might upload this to storage. for now, we use the unsplash url
  form.cover_image = buildImageUrl(photo.urls.raw, { width: 1200, quality: 80 })
}

async function createTour() {
  loading.value = true
  try {
    // get guide profile id first
    const { data: guide } = await supabase.from('guides').select('id').eq('user_id', user.value.id).single()
    
    if (!guide) throw new Error('guide profile not found')

    const { error } = await supabase.from('tours').insert({
      guide_id: guide.id,
      title: form.title,
      description: form.description,
      category: form.category,
      provider_name: form.provider_name,
      base_price_cents: form.category === 'free' ? null : Math.round(form.base_price * 100),
      tips_enabled: form.category === 'free' || form.tips_enabled,
      meeting_point: form.meeting_point,
      is_public: form.is_public
    })

    if (error) throw error

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
    <!-- header -->
    <div class="mb-12">
      <NuxtLink to="/guides/dashboard" class="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeftIcon class="size-4" />
        back to dashboard
      </NuxtLink>
      <h1 class="font-display text-4xl font-bold">create a new tour</h1>
      <p class="mt-2 text-muted-foreground">share your passion with the world</p>
    </div>

    <!-- steps progress -->
    <div class="mb-12 flex justify-between">
      <div 
        v-for="(step, idx) in steps" 
        :key="step.id"
        class="flex flex-col items-center gap-2"
        :class="idx <= currentStep ? 'text-primary' : 'text-muted-foreground/50'"
      >
        <div 
          class="flex size-10 items-center justify-center rounded-full border-2 text-lg font-bold transition-all duration-300"
          :class="idx <= currentStep ? 'border-primary bg-primary/10' : 'border-border'"
        >
          <component :is="step.icon" class="size-5" />
        </div>
        <span class="text-xs font-medium uppercase tracking-wider">{{ step.title }}</span>
      </div>
    </div>

    <!-- step content -->
    <div class="rounded-2xl border border-border bg-card p-8 shadow-sm">
      <!-- step 1: basics -->
      <div v-if="currentStep === 0" class="space-y-8 animate-in fade-in slide-in-from-right-4">
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
          <input
            v-model="form.title"
            type="text"
            placeholder="e.g. hidden gems of the jewish quarter"
            class="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label class="mb-2 block text-sm font-medium">provider name</label>
          <input
            v-model="form.provider_name"
            type="text"
            placeholder="your name or company name"
            class="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <!-- step 2: details -->
      <div v-else-if="currentStep === 1" class="space-y-8 animate-in fade-in slide-in-from-right-4">
        <div>
          <label class="mb-2 block text-sm font-medium">description</label>
          <textarea
            v-model="form.description"
            rows="6"
            placeholder="describe the experience, what guests will see, and why it's special..."
            class="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          ></textarea>
        </div>

        <div>
          <label class="mb-2 block text-sm font-medium">meeting point</label>
          <div class="relative">
            <MapPinIcon class="absolute left-3 top-3.5 size-5 text-muted-foreground" />
            <input
              v-model="form.meeting_point"
              type="text"
              placeholder="exact address or landmark"
              class="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      <!-- step 3: pricing -->
      <div v-else-if="currentStep === 2" class="space-y-8 animate-in fade-in slide-in-from-right-4">
        <div v-if="form.category !== 'free'">
          <label class="mb-2 block text-sm font-medium">ticket price (per person)</label>
          <div class="relative">
            <span class="absolute left-4 top-3.5 text-lg font-bold">€</span>
            <input
              v-model="form.base_price"
              type="number"
              min="0"
              class="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-lg font-bold outline-none focus:border-primary focus:ring-1 focus:ring-primary"
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
          <button 
            @click="form.tips_enabled = !form.tips_enabled"
            class="relative h-6 w-11 rounded-full px-0.5 transition-colors duration-200"
            :class="form.tips_enabled ? 'bg-primary' : 'bg-muted'"
          >
            <span 
              class="block size-5 rounded-full bg-white shadow-sm transition-transform duration-200"
              :class="form.tips_enabled ? 'translate-x-5' : 'translate-x-0'"
            />
          </button>
        </div>
      </div>

      <!-- step 4: visuals -->
      <div v-else-if="currentStep === 3" class="space-y-8 animate-in fade-in slide-in-from-right-4">
        <div>
          <label class="mb-4 block text-sm font-medium">cover photo</label>
          
          <div class="mb-6 flex gap-2">
            <input
              v-model="unsplashQuery"
              @keyup.enter="searchUnsplash"
              type="text"
              placeholder="search unsplash photos (e.g. budapest night)"
              class="flex-1 rounded-xl border border-border bg-background px-4 py-2 outline-none focus:border-primary"
            />
            <Button @click="searchUnsplash" variant="secondary" class="rounded-xl">search</Button>
          </div>

          <div v-if="unsplashPhotos.length" class="grid grid-cols-4 gap-4">
            <button
              v-for="photo in unsplashPhotos"
              :key="photo.id"
              @click="selectPhoto(photo)"
              class="group relative aspect-square overflow-hidden rounded-lg border-2 transition-all hover:scale-105 form:border-primary"
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

      <!-- navigation -->
      <div class="mt-12 flex justify-between border-t border-border pt-6">
        <Button
          v-if="currentStep > 0"
          variant="ghost"
          @click="currentStep--"
        >
          back
        </Button>
        <div v-else></div> <!-- spacer -->

        <Button
          v-if="currentStep < steps.length - 1"
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
