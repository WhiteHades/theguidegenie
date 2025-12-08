<script setup lang="ts">
// @ts-nocheck
import { PlusIcon, CalendarIcon, UsersIcon, LayoutGridIcon, ClockIcon, ImageIcon } from "lucide-vue-next"

definePageMeta({ 
  layout: "saas-app",
  middleware: ["guide-auth"]
})
useSeoMeta({ title: "guide dashboard" })

const { user, guideProfile } = useAuth()
const supabase = useSupabase()

// use guide profile from auth state
const guide = computed(() => guideProfile.value)

const { data: tours } = await useAsyncData('guide-tours', async () => {
  if (!guide.value) return []
  const { data } = await supabase.from("tours").select("*").eq("guide_id", guide.value.id).order("created_at", { ascending: false })
  return data || []
})

const { data: timeSlots } = await useAsyncData('guide-slots', async () => {
  if (!guide.value) return []
  const { data } = await supabase.from("time_slots").select("*, tours(*)").eq("guide_id", guide.value.id).gte("start_utc", new Date().toISOString()).order("start_utc", { ascending: true })
  return data || []
})

const activeTab = ref('overview') // overview, calendar
</script>

<template>
  <div class="container py-8">
    <div class="mb-8 flex items-center justify-between">
      <div>
        <h1 class="font-display text-3xl font-bold">guide dashboard</h1>
        <p class="mt-2 text-muted-foreground">welcome back, {{ guide?.name }}</p>
      </div>
      <div class="flex gap-3">
        <Button variant="outline" class="hidden sm:flex" @click="navigateTo('/guides/calendar')">
          <CalendarIcon class="mr-2 size-4" />
          calendar
        </Button>
        <Button @click="navigateTo('/guides/tours/create')" class="btn-bounce">
          <PlusIcon class="mr-2 size-4" />
          create tour
        </Button>
      </div>
    </div>

    <!-- tabs nav -->
    <div class="mb-8 flex border-b border-border">
      <button 
        @click="activeTab = 'overview'" 
        class="flex items-center gap-2 border-b-2 px-6 py-3 text-sm font-medium transition-colors"
        :class="activeTab === 'overview' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'"
      >
        <LayoutGridIcon class="size-4" /> overview
      </button>
      <button 
        @click="activeTab = 'calendar'" 
        class="flex items-center gap-2 border-b-2 px-6 py-3 text-sm font-medium transition-colors"
        :class="activeTab === 'calendar' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'"
      >
        <CalendarIcon class="size-4" /> calendar
      </button>
    </div>

    <!-- overview tab -->
    <div v-if="activeTab === 'overview'" class="space-y-8 animate-in fade-in slide-in-from-bottom-2">
      <!-- stats row -->
      <div class="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader class="pb-2"><CardTitle class="text-sm font-medium text-muted-foreground">active tours</CardTitle></CardHeader>
          <CardContent><div class="text-3xl font-bold">{{ tours?.length || 0 }}</div></CardContent>
        </Card>
        <Card>
          <CardHeader class="pb-2"><CardTitle class="text-sm font-medium text-muted-foreground">upcoming slots</CardTitle></CardHeader>
          <CardContent><div class="text-3xl font-bold">{{ timeSlots?.length || 0 }}</div></CardContent>
        </Card>
        <Card>
          <CardHeader class="pb-2"><CardTitle class="text-sm font-medium text-muted-foreground">est. revenue</CardTitle></CardHeader>
          <CardContent><div class="text-3xl font-bold">€0.00</div></CardContent>
        </Card>
      </div>

      <!-- tours list -->
      <div>
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-xl font-semibold small-caps">your tours</h2>
          <Button variant="link" size="sm" asChild><NuxtLink to="/guides/tours">view all</NuxtLink></Button>
        </div>
        
        <div v-if="!tours?.length" class="rounded-xl border border-dashed p-10 text-center">
          <p class="text-muted-foreground">you haven't created any tours yet</p>
          <Button @click="navigateTo('/guides/tours/create')" variant="link" class="mt-2 text-primary">create your first tour</Button>
        </div>

        <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card v-for="tour in tours.slice(0, 3)" :key="tour.id" class="overflow-hidden bg-card card-hover">
            <div class="h-32 bg-muted/50">
              <!-- placeholder for cover image -->
              <div v-if="!tour.cover_image" class="flex h-full items-center justify-center text-muted-foreground/30">
                <ImageIcon class="size-8" />
              </div>
            </div>
            <CardHeader>
              <div class="mb-2 flex items-center justify-between">
                <Badge :variant="tour.is_public ? 'default' : 'secondary'" class="text-xs">{{ tour.is_public ? 'published' : 'draft' }}</Badge>
                <div class="text-xs font-bold uppercase tracking-wider text-muted-foreground">{{ tour.category }}</div>
              </div>
              <CardTitle class="line-clamp-1 text-lg">{{ tour.title }}</CardTitle>
            </CardHeader>
            <CardFooter class="flex justify-between border-t bg-muted/20 p-4">
              <span class="text-sm font-bold">{{ tour.base_price_cents ? `€${(tour.base_price_cents/100).toFixed(0)}` : 'free' }}</span>
              <Button variant="ghost" size="sm" class="h-auto p-0 text-muted-foreground hover:text-foreground">manage &rarr;</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>

    <!-- calendar tab (simple list view for now) -->
    <div v-else class="animate-in fade-in slide-in-from-bottom-2">
      <div class="mb-6 flex items-center justify-between">
         <h2 class="text-xl font-semibold small-caps">schedule</h2>
         <Button size="sm" variant="outline"><PlusIcon class="mr-2 size-4" /> add slots</Button>
      </div>

      <div v-if="!timeSlots?.length" class="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
        no upcoming slots scheduled
      </div>

      <div v-else class="space-y-3">
        <div v-for="slot in timeSlots" :key="slot.id" class="flex items-center justify-between rounded-xl border border-border p-4 transition-colors hover:bg-muted/30">
          <div class="flex items-center gap-4">
            <div class="flex flex-col items-center rounded-lg bg-primary/10 px-3 py-1 text-primary">
              <span class="text-xs font-bold uppercase">{{ new Date(slot.start_utc).toLocaleString('en', { weekday: 'short' }) }}</span>
              <span class="text-lg font-bold">{{ new Date(slot.start_utc).getDate() }}</span>
            </div>
            <div>
              <div class="font-medium">{{ slot.tours?.title }}</div>
              <div class="flex items-center gap-3 text-sm text-muted-foreground">
                <span class="flex items-center gap-1"><ClockIcon class="size-3" /> {{ new Date(slot.start_utc).toLocaleTimeString('en', {hour: '2-digit', minute:'2-digit'}) }}</span>
                <span class="flex items-center gap-1"><UsersIcon class="size-3" /> {{ slot.capacity }} spots</span>
              </div>
            </div>
          </div>
          <Badge :variant="slot.is_open ? 'outline' : 'secondary'">{{ slot.is_open ? 'open' : 'full' }}</Badge>
        </div>
      </div>
    </div>
  </div>
</template>

