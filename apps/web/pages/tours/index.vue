<script setup lang="ts">
import { MapPinIcon, UserIcon } from "lucide-vue-next"

definePageMeta({
  layout: "default",
})

useSeoMeta({
  title: "browse tours - guidegenie",
  description: "discover amazing walking tours in budapest with local guides",
})

const supabase = useSupabase()
const selectedCity = ref("all")

const { data: tours, pending: loading } = await useAsyncData('public-tours', async () => {
  const { data } = await supabase
    .from("tours")
    .select("*, guides(*)")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
  
  return data || []
})

const filteredTours = computed(() => {
  if (!tours.value || selectedCity.value === "all") return tours.value || []
  return tours.value.filter((tour) => tour.guides?.city === selectedCity.value)
})

const cities = computed(() => {
  if (!tours.value) return ["all"]
  const citySet = new Set(tours.value.map((t) => t.guides?.city).filter(Boolean))
  return ["all", ...Array.from(citySet)]
})
</script>

<template>
  <div class="container py-12">
    <div class="mb-12 text-center">
      <h1 class="text-4xl font-bold">discover budapest</h1>
      <p class="mt-4 text-lg text-muted-foreground">
        explore the city with passionate local guides
      </p>
    </div>

    <!-- city filter -->
    <div class="mb-8 flex justify-center">
      <div class="flex gap-2">
        <Button
          v-for="city in cities"
          :key="city"
          :variant="selectedCity === city ? 'default' : 'outline'"
          @click="selectedCity = city"
        >
          {{ city === "all" ? "all cities" : city }}
        </Button>
      </div>
    </div>

    <!-- loading state -->
    <div v-if="loading" class="py-12 text-center">
      <p class="text-muted-foreground">loading tours...</p>
    </div>

    <!-- no tours -->
    <div v-else-if="filteredTours.length === 0" class="py-12 text-center">
      <p class="text-muted-foreground">no tours available at the moment</p>
    </div>

    <!-- tours grid -->
    <div v-else class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card
        v-for="tour in filteredTours"
        :key="tour.id"
        class="cursor-pointer transition-shadow hover:shadow-lg"
        @click="navigateTo(`/tours/${tour.id}`)"
      >
        <CardHeader>
          <CardTitle>{{ tour.title }}</CardTitle>
          <CardDescription class="line-clamp-2">
            {{ tour.description || "explore this amazing tour" }}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div class="space-y-2">
            <div v-if="tour.guides" class="flex items-center gap-2 text-sm">
              <UserIcon class="size-4 text-muted-foreground" />
              <span>{{ tour.guides.name }}</span>
            </div>
            <div v-if="tour.guides?.city" class="flex items-center gap-2 text-sm">
              <MapPinIcon class="size-4 text-muted-foreground" />
              <span>{{ tour.guides.city }}</span>
            </div>
            <div v-if="tour.base_price_cents" class="mt-4">
              <Badge variant="secondary">
                from €{{ (tour.base_price_cents / 100).toFixed(0) }}
              </Badge>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" class="w-full">
            view details &rarr;
          </Button>
        </CardFooter>
      </Card>
    </div>
  </div>
</template>

