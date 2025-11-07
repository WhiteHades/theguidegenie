<script setup lang="ts">
// @ts-nocheck - Nuxt auto-imports (definePageMeta, useAsyncData, useSupabase)
import { onMounted } from 'vue'
import { MapPinIcon, UsersIcon, CalendarIcon, ShieldCheckIcon, SparklesIcon } from 'lucide-vue-next'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

definePageMeta({
  layout: 'marketing',
})

const supabase = useSupabase()

const { data: featuredTours } = await useAsyncData('featured-tours', async () => {
  const { data } = await supabase
    .from('tours')
    .select(`
      *,
      guides (
        name,
        city,
        avatar_url
      )
    `)
    .eq('is_public', true)
    .limit(3)
  
  return data || []
}, {
  server: false
})

const features = [
  {
    icon: MapPinIcon,
    title: 'explore budapest',
    description: 'hidden gems and iconic landmarks with locals who actually live here'
  },
  {
    icon: UsersIcon,
    title: 'real guides',
    description: 'budapest natives with stories that bring the city to life'
  },
  {
    icon: CalendarIcon,
    title: 'instant booking',
    description: 'no account needed. just pick a time that works for you'
  },
  {
    icon: ShieldCheckIcon,
    title: 'trusted',
    description: 'verified guides, secure bookings, easy cancellation'
  }
]

const tourImages = [
  'https://images.unsplash.com/photo-1541849546-216549ae216d?w=800&q=80', // budapest parliament
  'https://images.unsplash.com/photo-1600103688242-1c29e1f2c3c0?w=800&q=80', // chain bridge
  'https://images.unsplash.com/photo-1541588713592-79b3feaa38c9?w=800&q=80', // budapest street
]

onMounted(() => {
  if (typeof window !== 'undefined') {
    // hero fade in
    gsap.from('.hero-content', {
      opacity: 0,
      y: 30,
      duration: 1,
      ease: 'power3.out'
    })

    // tour cards stagger
    gsap.from('.tour-card', {
      scrollTrigger: {
        trigger: '.tours-section',
        start: 'top 80%',
      },
      opacity: 0,
      y: 40,
      stagger: 0.15,
      duration: 0.8,
      ease: 'power3.out'
    })

    // features stagger
    gsap.from('.feature-card', {
      scrollTrigger: {
        trigger: '.features-section',
        start: 'top 80%',
      },
      opacity: 0,
      scale: 0.9,
      stagger: 0.1,
      duration: 0.6,
      ease: 'back.out(1.7)'
    })
  }
})
</script>

<template>
  <div class="min-h-screen">
    <!-- hero section with gradient -->
    <section class="hero-content relative overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
      <div class="container relative pb-24 pt-32 text-center">
        <div class="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm lowercase">
          <SparklesIcon class="size-4 text-primary" />
          <span class="text-primary">authentic local experiences</span>
        </div>

        <h1 class="lowercase-vibe mx-auto max-w-4xl text-balance text-6xl font-bold tracking-tight lg:text-8xl">
          explore budapest
          <span class="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            your way
          </span>
        </h1>
        
        <p class="mx-auto mt-8 max-w-2xl text-balance text-lg text-muted-foreground lowercase">
          book authentic walking tours with budapest locals. instant booking, no signup required, just pure exploration.
        </p>

        <div class="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button size="lg" class="smooth-hover rounded-full px-8 lowercase" asChild>
            <NuxtLink to="/tours">
              browse tours
            </NuxtLink>
          </Button>
          <Button variant="outline" size="lg" class="smooth-hover rounded-full px-8 lowercase glass" asChild>
            <NuxtLink to="/guides/signup">
              become a guide
            </NuxtLink>
          </Button>
        </div>

        <!-- floating images -->
        <div class="mt-16 grid gap-6 px-8 sm:grid-cols-3">
          <img 
            v-for="(img, i) in tourImages" 
            :key="i"
            :src="img" 
            :alt="`budapest tour ${i + 1}`"
            class="smooth-hover aspect-video w-full rounded-2xl object-cover shadow-2xl glow"
            :style="{ animationDelay: `${i * 0.2}s` }"
          />
        </div>
      </div>
    </section>

    <!-- featured tours -->
    <section v-if="featuredTours && featuredTours.length > 0" class="tours-section py-24">
      <div class="container">
        <div class="mb-12 text-center">
          <h2 class="lowercase-vibe mb-4 text-4xl font-bold lg:text-5xl">
            popular tours
          </h2>
          <p class="text-muted-foreground lowercase">
            handpicked experiences by local experts
          </p>
        </div>
        
        <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <NuxtLink
            v-for="(tour, idx) in featuredTours"
            :key="tour.id"
            :to="`/tours/${tour.id}`"
            class="tour-card group overflow-hidden rounded-3xl border border-surface1 bg-card/50 glass transition-all hover:border-primary/30"
          >
            <div class="aspect-[4/3] overflow-hidden">
              <img 
                :src="tourImages[idx % tourImages.length]" 
                :alt="tour.title"
                class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
            </div>
            <div class="p-6">
              <h3 class="lowercase-vibe text-xl font-semibold group-hover:text-primary transition-colors">
                {{ tour.title }}
              </h3>
              <p class="mt-3 line-clamp-2 text-sm text-muted-foreground lowercase">
                {{ tour.description }}
              </p>
              <div class="mt-4 flex items-center gap-3 text-sm text-muted-foreground">
                <div class="flex items-center gap-1.5">
                  <MapPinIcon class="size-4" />
                  <span class="lowercase">{{ tour.guides?.city }}</span>
                </div>
                <span>•</span>
                <span class="lowercase">{{ tour.guides?.name }}</span>
              </div>
              <div v-if="tour.base_price_cents" class="mt-6 flex items-baseline gap-2">
                <span class="text-2xl font-bold text-primary">
                  €{{ (tour.base_price_cents / 100).toFixed(0) }}
                </span>
                <span class="text-sm text-muted-foreground lowercase">per person</span>
              </div>
            </div>
          </NuxtLink>
        </div>

        <div class="mt-12 text-center">
          <Button variant="outline" size="lg" class="smooth-hover rounded-full px-8 lowercase glass" asChild>
            <NuxtLink to="/tours">explore all tours</NuxtLink>
          </Button>
        </div>
      </div>
    </section>

    <!-- features -->
    <section class="features-section py-24">
      <div class="container">
        <div class="mb-16 text-center">
          <h2 class="lowercase-vibe mb-4 text-4xl font-bold lg:text-5xl">
            why choose us
          </h2>
          <p class="text-muted-foreground lowercase">
            simple, authentic, memorable
          </p>
        </div>

        <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div
            v-for="feature in features"
            :key="feature.title"
            class="feature-card glass group rounded-3xl border border-surface1 p-8 text-center transition-all hover:border-primary/30"
          >
            <div class="mx-auto flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 transition-all group-hover:scale-110 group-hover:from-primary/30 group-hover:to-accent/30">
              <component :is="feature.icon" class="size-8 text-primary" />
            </div>
            <h3 class="lowercase-vibe mt-6 text-lg font-semibold">{{ feature.title }}</h3>
            <p class="mt-3 text-sm text-muted-foreground lowercase">
              {{ feature.description }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- cta section -->
    <section class="relative overflow-hidden py-32">
      <div class="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10" />
      <div class="container relative text-center">
        <h2 class="lowercase-vibe mb-6 text-5xl font-bold lg:text-6xl">
          ready to explore?
        </h2>
        <p class="mx-auto max-w-2xl text-lg text-muted-foreground lowercase">
          join hundreds of travelers discovering budapest's hidden gems with local guides
        </p>
        <div class="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button size="lg" class="smooth-hover glow rounded-full px-10 py-6 text-lg lowercase" asChild>
            <NuxtLink to="/tours">
              start exploring
            </NuxtLink>
          </Button>
        </div>
      </div>
    </section>
  </div>
</template>
