<script setup lang="ts">
import { EyeIcon, PlusIcon } from "lucide-vue-next";

definePageMeta({
  layout: "saas-app",
  middleware: ["guide-auth"],
});

useSeoMeta({ title: "my tours" });

await callOnce(() => useAuth().fetchUser());

const supabase = useSupabase();

if (!supabase) {
  throw createError({
    statusCode: 500,
    statusMessage: "supabase client unavailable",
  });
}

const { data: tours } = await useAsyncData("guide-tour-list", async () => {
  if (!supabase) 
return [];
  const { data, error } = await supabase.rpc("get_guide_tours");
  if (error) 
throw error;
  return data || [];
});
</script>

<template>
  <div class="container py-8">
    <div class="mb-8 flex items-center justify-between gap-4">
      <div>
        <h1 class="font-display text-3xl font-bold">my tours</h1>
        <p class="mt-2 text-muted-foreground">all tours you currently manage</p>
      </div>

      <Button @click="navigateTo('/guides/tours/create')">
        <PlusIcon class="mr-2 size-4" />
        create tour
      </Button>
    </div>

    <div v-if="!tours?.length" class="rounded-2xl border border-dashed p-12 text-center text-muted-foreground">
      no tours yet
    </div>

    <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card v-for="tour in tours" :key="tour.id" class="overflow-hidden">
        <div v-if="tour.cover_image" class="h-40">
          <img :src="tour.cover_image" :alt="tour.title" class="size-full object-cover" />
        </div>
        <CardHeader>
          <div class="flex items-center justify-between gap-3">
            <CardTitle class="line-clamp-1 text-lg">{{ tour.title }}</CardTitle>
            <Badge :variant="tour.is_public ? 'default' : 'secondary'">{{ tour.is_public ? 'live' : 'draft' }}</Badge>
          </div>
          <CardDescription class="line-clamp-2">{{ tour.description || 'no description yet' }}</CardDescription>
        </CardHeader>
        <CardContent class="space-y-2 text-sm text-muted-foreground">
          <div>{{ tour.category }} · {{ tour.base_price_cents ? `EUR ${(tour.base_price_cents / 100).toFixed(0)}` : 'free' }}</div>
          <div>{{ tour.upcoming_slot_count }} upcoming slots</div>
          <div>{{ tour.confirmed_guest_count }} confirmed guests</div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" class="w-full" @click="navigateTo(`/tours/${tour.id}`)">
            <EyeIcon class="mr-2 size-4" />
            view listing
          </Button>
        </CardFooter>
      </Card>
    </div>
  </div>
</template>
